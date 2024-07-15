import {Button, Form, Modal, Col, Row, Alert} from "react-bootstrap";
import {useCallback} from "react";
import {useDispatch, useSelector} from "react-redux";
import {Formik} from "formik";
import * as Yup from 'yup';
import {createReward, deleteReward, fetchManageableRedemptionList, updateReward} from "./RedemptionActions";

export default function RewardModal({ show, onClose, reward=null }) {
    const dispatch = useDispatch();
    const { lastCreateError, lastUpdateError, rewards } = useSelector(state => state.redemptions);

    const isReadOnly = reward && rewards.includes(reward);

    const onSubmit = useCallback(async (data) => {

        let res;

        if (reward) {
            // update
            res = await dispatch(updateReward(reward.id, data));
        } else {
            // create

            // Remove fields that were not set
            const payload = {...data};
            if (!payload.is_max_per_stream_enabled) delete payload.max_per_stream;
            if (!payload.is_max_per_user_per_stream_enabled) delete payload.max_per_user_per_stream;
            if (!payload.is_global_cooldown_enabled) delete payload.global_cooldown_seconds;
            if (!payload.prompt.trim()) delete payload.prompt;

            res = await dispatch(createReward(payload));
        }

        // success - close and refresh
        if (res) {
            await dispatch(fetchManageableRedemptionList());
            onClose();
        }

    }, [dispatch, reward, onClose]);

    const handleDelete = useCallback(async () => {
        if (window.confirm('Really delete reward?')) {
            const success = await dispatch(deleteReward(reward.id));
            if (success) {
                await dispatch(fetchManageableRedemptionList());
                onClose();
            }
        }
    }, [dispatch, reward, onClose]);

    const handleDuplicate = useCallback(async () => {

        const payload = {
            title: `${reward.title} copy ${Math.floor(Date.now()/1000)}`.substring(0, 45),
            cost: reward.cost,

            prompt: reward.prompt || '',
            is_enabled: reward.is_enabled,
            background_color: reward.background_color,

            is_user_input_required: reward.is_user_input_required,

            is_max_per_stream_enabled: reward.max_per_stream_setting.is_enabled,
            max_per_stream: Math.max(1, reward.max_per_stream_setting.max_per_stream),

            is_max_per_user_per_stream_enabled: reward.max_per_user_per_stream_setting.is_enabled,
            max_per_user_per_stream: Math.max(1, reward.max_per_user_per_stream_setting.max_per_user_per_stream),

            is_global_cooldown_enabled: reward.global_cooldown_setting.is_enabled,
            global_cooldown_seconds: Math.max(1, reward.global_cooldown_setting.global_cooldown_seconds),

            should_redemptions_skip_request_queue: reward.should_redemptions_skip_request_queue
        };
        
        const res = await dispatch(createReward(payload));
        // success - close and refresh
        if (res) {
            await dispatch(fetchManageableRedemptionList());
            onClose();
        }
        
    }, [dispatch, reward, onClose]);

    return (
        <>
            <Modal show={show} onHide={onClose}>
                <Formik
                    onSubmit={onSubmit}
                    validationSchema={Yup.object({
                        title: Yup.string().max(45).label('title').required(),                              // The custom reward’s title. The title may contain a maximum of 45 characters and it must be unique amongst all of the broadcaster’s custom rewards.
                        cost: Yup.number().min(1).max(Number.MAX_SAFE_INTEGER).label('cost').required(),    // The cost of the reward, in Channel Points. The minimum is 1 point.

                        prompt: Yup.string().max(200).label('user input prompt'),                           // The prompt shown to the viewer when they redeem the reward. Specify a prompt if is_user_input_required is true. The prompt is limited to a maximum of 200 characters.
                        is_enabled: Yup.bool().label('reward enabled'),                                          // A Boolean value that determines whether the reward is enabled. Viewers see only enabled rewards. The default is true.
                        background_color: Yup.string().matches(/^#[a-f0-9]{6}$/i),                              // The background color to use for the reward. Specify the color using Hex format (for example, #9147FF).

                        is_user_input_required: Yup.bool().label('is user input required'),                      // A Boolean value that determines whether the user needs to enter information when redeeming the reward. See the prompt field. The default is false.

                        is_max_per_stream_enabled: Yup.bool().label('is max per stream enabled'),                // A Boolean value that determines whether to limit the maximum number of redemptions allowed per live stream (see the max_per_stream field). The default is false.
                        max_per_stream: Yup.number().min(1).max(Number.MAX_SAFE_INTEGER).label('max per stream') // The maximum number of redemptions allowed per live stream. Applied only if is_max_per_stream_enabled is true. The minimum value is 1.
                            .when('is_max_per_stream_enabled', {
                                is: val => !!val,
                                then: schema => schema.required(),
                                otherwise: (schema) => schema.optional()
                            }),

                        is_max_per_user_per_stream_enabled: Yup.bool().label('is max per user per stream'),            // A Boolean value that determines whether to limit the maximum number of redemptions allowed per user per stream (see the max_per_user_per_stream field). The default is false.
                        max_per_user_per_stream: Yup.number().min(1).max(Number.MAX_SAFE_INTEGER).label('max_per_user_per_stream') // The maximum number of redemptions allowed per user per stream. Applied only if is_max_per_user_per_stream_enabled is true. The minimum value is 1.
                            .when('is_max_per_user_per_stream_enabled', {
                                is: val => !!val,
                                then: schema => schema.required(),
                                otherwise: (schema) => schema.optional()
                            }),

                        is_global_cooldown_enabled: Yup.bool().label('is global cooldown'),                       // A Boolean value that determines whether to apply a cooldown period between redemptions (see the global_cooldown_seconds field for the duration of the cooldown period). The default is false.
                        global_cooldown_seconds: Yup.number().max(Number.MAX_SAFE_INTEGER).label('global cooldown seconds') // The cooldown period, in seconds. Applied only if the is_global_cooldown_enabled field is true. The minimum value is 1; however, the minimum value is 60 for it to be shown in the Twitch UX.
                            .when('is_global_cooldown_enabled', {
                                is: val => !!val,
                                then: schema => schema.required(),
                                otherwise: (schema) => schema.optional()
                            }),

                        should_redemptions_skip_request_queue: Yup.bool(), // A Boolean value that determines whether redemptions should be set to FULFILLED status immediately when a reward is redeemed. If false, status is set to UNFULFILLED and follows the normal request queue process. The default is false.
                    })}
                    initialValues={reward ? {
                        title: reward.title || '',
                        cost: reward.cost,

                        prompt: reward.prompt || '',
                        is_enabled: reward.is_enabled,
                        background_color: reward.background_color,

                        is_user_input_required: reward.is_user_input_required,

                        is_max_per_stream_enabled: reward.max_per_stream_setting.is_enabled,
                        max_per_stream: Math.max(1, reward.max_per_stream_setting.max_per_stream),

                        is_max_per_user_per_stream_enabled: reward.max_per_user_per_stream_setting.is_enabled,
                        max_per_user_per_stream: Math.max(1, reward.max_per_user_per_stream_setting.max_per_user_per_stream),

                        is_global_cooldown_enabled: reward.global_cooldown_setting.is_enabled,
                        global_cooldown_seconds: Math.max(1, reward.global_cooldown_setting.global_cooldown_seconds),

                        should_redemptions_skip_request_queue: reward.should_redemptions_skip_request_queue
                    } : {
                        title: '',
                        cost: 1,

                        prompt: '',
                        is_enabled: true,
                        background_color: '#E69900',

                        is_user_input_required: false,

                        is_max_per_stream_enabled: false,
                        max_per_stream: 1,

                        is_max_per_user_per_stream_enabled: false,
                        max_per_user_per_stream: 1,

                        is_global_cooldown_enabled: false,
                        global_cooldown_seconds: 60,

                        should_redemptions_skip_request_queue: false,
                    }}
                >
                    {({ handleSubmit, errors, handleChange, handleBlur, values, touched }) => {
                        // console.log({ errors, values });
                        return (

                            <Form onSubmit={handleSubmit}>
                                <Modal.Header closeButton>
                                    <Modal.Title>
                                        Create new reward
                                    </Modal.Title>
                                </Modal.Header>
                                <Modal.Body>

                                    <Form.Group controlId="title" className="mb-3">
                                        <Form.Label className="fw-semibold">Title</Form.Label>
                                        <Form.Control
                                            name="title"
                                            value={values.title}
                                            isInvalid={touched.title && !!errors.title}
                                            placeholder={"e.g. Scene: Fall Drone Flight"}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            type="text"
                                            maxLength={45}
                                            disabled={isReadOnly}
                                        />
                                        <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
                                    </Form.Group>
                                    <Row>
                                        <Form.Group as={Col} xs={7} controlId="cost" className="mb-3">
                                            <Form.Label className="fw-semibold">Cost</Form.Label>
                                            <Form.Control
                                                name="cost"
                                                type="number"
                                                value={values.cost}
                                                isInvalid={touched.cost && !!errors.cost}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                min={1}
                                                style={{
                                                    maxWidth: '10em'
                                                }}
                                                disabled={isReadOnly}
                                            />
                                            <Form.Control.Feedback type="invalid">{errors.cost}</Form.Control.Feedback>
                                        </Form.Group>
                                        <Form.Group as={Col} xs={5} controlId="should_redemptions_skip_request_queue" className="mb-3">
                                            <Form.Label className="fw-semibold">Skip request queue?</Form.Label>
                                            <Form.Check
                                                name="should_redemptions_skip_request_queue"
                                                value="yes"
                                                checked={values.should_redemptions_skip_request_queue}
                                                label="Skip the queue"
                                                isInvalid={touched.should_redemptions_skip_request_queue && !!errors.should_redemptions_skip_request_queue}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                disabled={isReadOnly}
                                            />
                                            <Form.Control.Feedback type="invalid">{errors.should_redemptions_skip_request_queue}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Row>
                                    <Form.Group controlId="prompt" className="mb-3">
                                        <Form.Label className="fw-semibold">Prompt</Form.Label>
                                        <Form.Control
                                            name="prompt"
                                            value={values.prompt}
                                            isInvalid={touched.prompt && !!errors.prompt}
                                            placeholder={"e.g. Fall drone footage from 2022"}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            type="text"
                                            maxLength={200}
                                            disabled={isReadOnly}
                                        />
                                        <Form.Control.Feedback type="invalid">{errors.prompt}</Form.Control.Feedback>
                                    </Form.Group>
                                    <Form.Group controlId="background_color" className="mb-3">
                                        <Form.Label className="fw-semibold">Background color</Form.Label>
                                        <Form.Control
                                            name="background_color"
                                            value={values.background_color}
                                            isInvalid={touched.background_color && !!errors.background_color}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            type="color"
                                            disabled={isReadOnly}
                                        />
                                        <Form.Control.Feedback type="invalid">{errors.background_color}</Form.Control.Feedback>
                                    </Form.Group>
                                    <Form.Group controlId="is_user_input_required" className="mb-4">
                                        <Form.Label className="fw-semibold">User input required?</Form.Label>
                                        <Form.Check
                                            name="is_user_input_required"
                                            value="yes"
                                            checked={values.is_user_input_required}
                                            label="User will be prompted to enter text when redeeming"
                                            isInvalid={touched.is_user_input_required && !!errors.is_user_input_required}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            disabled={isReadOnly}
                                        />
                                    </Form.Group>

                                    <Row>
                                        <Form.Group as={Col} xs={7} controlId="is_max_per_stream_enabled" className="mb-3">
                                            <Form.Label className="fw-semibold">Max redeems per stream?</Form.Label>
                                            <Form.Check
                                                name="is_max_per_stream_enabled"
                                                value="yes"
                                                label="Limit redemptions per stream"
                                                checked={values.is_max_per_stream_enabled}
                                                isInvalid={touched.is_max_per_stream_enabled && !!errors.is_max_per_stream_enabled}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                disabled={isReadOnly}
                                            />
                                        </Form.Group>
                                        <Form.Group as={Col} xs={5} controlId="max_per_stream" className="mb-3">
                                            <Form.Label className="fw-semibold">Max per stream</Form.Label>
                                            <Form.Control
                                                name="max_per_stream"
                                                type="number"
                                                value={values.max_per_stream}
                                                isInvalid={touched.max_per_stream && !!errors.max_per_stream}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                min={1}
                                                disabled={isReadOnly}
                                            />
                                            <Form.Control.Feedback type="invalid">{errors.max_per_stream}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Row>

                                    <Row>
                                        <Form.Group as={Col} xs={7} controlId="is_max_per_user_per_stream_enabled" className="mb-3">
                                            <Form.Label className="fw-semibold">Max redeems per user?</Form.Label>
                                            <Form.Check
                                                name="is_max_per_user_per_stream_enabled"
                                                value="yes"
                                                label="Limit per user, per stream"
                                                checked={values.is_max_per_user_per_stream_enabled}
                                                isInvalid={touched.is_max_per_user_per_stream_enabled && !!errors.is_max_per_user_per_stream_enabled}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                disabled={isReadOnly}
                                            />
                                        </Form.Group>
                                        <Form.Group as={Col} xs={5} controlId="max_per_user_per_stream" className="mb-3">
                                            <Form.Label className="fw-semibold">Max per user</Form.Label>
                                            <Form.Control
                                                name="max_per_user_per_stream"
                                                type="number"
                                                value={values.max_per_user_per_stream}
                                                isInvalid={touched.max_per_user_per_stream && !!errors.max_per_user_per_stream}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                min={1}
                                                disabled={isReadOnly}
                                            />
                                            <Form.Control.Feedback type="invalid">{errors.max_per_user_per_stream}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Row>

                                    <Row>
                                        <Form.Group as={Col} xs={7} controlId="is_global_cooldown_enabled" className="mb-3">
                                            <Form.Label className="fw-semibold">Global cooldown?</Form.Label>
                                            <Form.Check
                                                name="is_global_cooldown_enabled"
                                                value="yes"
                                                label="Cooldown between redemptions"
                                                checked={values.is_global_cooldown_enabled}
                                                isInvalid={touched.is_global_cooldown_enabled && !!errors.is_global_cooldown_enabled}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                disabled={isReadOnly}
                                            />
                                        </Form.Group>
                                        <Form.Group as={Col} xs={5} controlId="global_cooldown_seconds" className="mb-3">
                                            <Form.Label className="fw-semibold">Cooldown seconds</Form.Label>
                                            <Form.Control
                                                name="global_cooldown_seconds"
                                                type="number"
                                                value={values.global_cooldown_seconds}
                                                isInvalid={touched.global_cooldown_seconds && !!errors.global_cooldown_seconds}
                                                onChange={handleChange}
                                                onBlur={handleBlur}
                                                min={1}
                                                disabled={isReadOnly}
                                            />
                                            <Form.Control.Feedback type="invalid">{errors.global_cooldown_seconds}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Row>

                                    {(lastCreateError || lastUpdateError) && <Alert variant={"danger"}>Failed: {(lastCreateError || lastUpdateError).message || `Something went wrong trying to ${reward ? 'update' : 'create'} reward :(` }</Alert> }

                                    {isReadOnly && <Alert variant={"warning"}>Note: This reward is read-only</Alert> }

                                </Modal.Body>
                                <Modal.Footer>
                                    {reward && (
                                        <div className="flex-grow-1">
                                            <Button variant="danger" onClick={handleDelete} className="me-2">
                                                <i className="bi bi-trash3-fill"/>
                                            </Button>
                                            <Button variant="warning" onClick={handleDuplicate}>
                                                <i className="bi bi-copy"/>
                                            </Button>
                                        </div>
                                    )}
                                    <Button variant="secondary" onClick={onClose}>
                                        Close
                                    </Button>
                                    <Button variant="primary" type="submit" onClick={handleSubmit}
                                            disabled={isReadOnly}>
                                        Save Changes
                                    </Button>
                                </Modal.Footer>

                            </Form>
                        );
                    }}
                </Formik>
            </Modal>
        </>
    )
}