import {Button, Form} from "react-bootstrap";
import {
    setProfileSettings, toggleReplayBufferEnabled,
} from "./OBSActions";
import {useCallback, useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import {useFormik} from "formik";
import * as Yup from "yup";

export default function ReplayBufferSettings() {
    const dispatch = useDispatch();
    const replayBufferStatus = useSelector(state => state.obs.replayBufferStatus);
    const profileSettings = useSelector(state => state.obs.profileSettings);
    const {
        replayBufferEnabled,
        replayBufferTime,
        replayBufferPrefix,
    } = profileSettings

    const handleOBSUpdate = useCallback(async (values) => {
        const { prefix, time, enabled } = values;

        // TODO: updating while stream is live might not work

        // Update OBS preferences
        await dispatch(setProfileSettings({
            replayBufferEnabled: enabled,
            replayBufferTime: time,
            replayBufferPrefix: prefix
        }))

        // Toggle to apply the settings
        // await dispatch(toggleReplayBufferEnabled(false));
        // if (enabled) {
            // await dispatch(toggleReplayBufferEnabled(true));
        // }

    }, [dispatch]);

    const handleToggleReplayBuffer = useCallback(async () => {
        await dispatch(toggleReplayBufferEnabled(null));
    }, [dispatch]);

    const formik = useFormik({
        onSubmit: handleOBSUpdate,
        validationSchema: Yup.object({
            prefix: Yup.string().max(140).matches(/^[a-zA-Z0-9_-]+$/, 'prefix must only contain letters, numbers, - or _').label('replay file prefix').optional(),
            time: Yup.number().min(5).max(9999).label('replay time').required(),
        }),
        initialValues: {
            prefix: replayBufferPrefix || '',
            time: replayBufferTime || '',
            enabled: replayBufferEnabled || false
        },
        enableReinitialize: true
    })

    // Reset the form when the profile settings change (e.g. when switching profiles, reconnecting, etc)
    useEffect(() => {
        formik.resetForm()
    }, [profileSettings]); // eslint-disable-line react-hooks/exhaustive-deps

    const { values, errors, handleSubmit, handleChange, handleBlur, touched } = formik;
    return (
        <Form onSubmit={handleSubmit} key={profileSettings}>
            <Form.Group controlId="prefix" className="mb-3">
                <Form.Label>Replay File Prefix</Form.Label>
                <Form.Control type="text"
                              value={values.prefix}
                              isInvalid={touched.prefix && !!errors.prefix}
                              placeholder={"e.g. Replay"}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              maxLength={140}
                />
                <Form.Control.Feedback type="invalid">{errors.prefix}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="time" className="mb-3">
                <Form.Label>Replay Time</Form.Label>
                <Form.Control type="number"
                              value={values.time}
                              isInvalid={touched.time && !!errors.time}
                              onChange={handleChange}
                              onBlur={handleBlur}
                />
                <Form.Control.Feedback type="invalid">{errors.time}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="enabled" className="mb-3">
                <Form.Label>Replay Buffer Enabled</Form.Label>
                <Form.Check type="switch"
                            checked={values.enabled}
                            isInvalid={touched.enabled && !!errors.enabled}
                            onChange={handleChange}
                            onBlur={handleBlur}
                />
                <Form.Text>If turning on the replay buffer for the first time, you will need to restart OBS for it to appear.</Form.Text>
            </Form.Group>
            <div className="d-flex">
                <div className='flex-grow-1'>
                    <Button variant="primary" type="submit">
                        Update Replay Buffer Settings
                    </Button>
                </div>
                <Button variant={replayBufferStatus.outputActive ? 'danger' : 'success'} onClick={handleToggleReplayBuffer}>
                    {replayBufferStatus.outputActive ? 'Stop' : 'Start'} Replay Buffer
                </Button>
            </div>
        </Form>
    );
}