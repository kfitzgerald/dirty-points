import Skeleton from "react-loading-skeleton";
import {Alert, Button, Form, Table} from "react-bootstrap";
import {useDispatch, useSelector} from "react-redux";
import {useCallback, useState} from "react";
import {clearCreateUpdateErrors, executeReward, updateReward} from "./RedemptionActions";
import RewardModal from "./RewardModal";
import OBSMappingModal from "../obs/OBSMappingModal";
import RewardMappingButton from "./RewardMappingButton";
import HoverToolTip from "../common/HoverToolTip";

export default function RewardsTable({ showOther=false }) {
    const dispatch = useDispatch();
    const [selectedReward, setSelectedReward] = useState(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showMappingModal, setShowMappingModal] = useState(false);
    const redemptions = useSelector(state => state.redemptions);
    const { mappings, isFetchingRewards, isFetchingManageableRewards, lastError  } = redemptions;

    const manageableRewards = redemptions.manageableRewards;
    const otherRewards = redemptions.rewards.filter(reward => !manageableRewards.find(mr => mr.id === reward.id));
    const rewards = showOther ? otherRewards : manageableRewards;

    const handleModalClose = useCallback(() => {
        setShowUpdateModal(false);
        dispatch(clearCreateUpdateErrors());
    }, [dispatch]);

    const handleMappingModalClose = useCallback(() => {
        setShowMappingModal(false);
    }, []);

    const handleEditReward = useCallback((e) => {
        const id = e.target.dataset.id;
        const reward = manageableRewards.find(r => r.id === id) || otherRewards.find(r => r.id === id);
        if (reward) {
            setSelectedReward(reward);
            setShowUpdateModal(true);
        }
    }, [manageableRewards, otherRewards]);

    const handleEditMapping = useCallback((e) => {
        const id = e.target.dataset.id;
        const reward = manageableRewards.find(r => r.id === id) || otherRewards.find(r => r.id === id);
        if (reward) {
            setSelectedReward(reward);
            setShowMappingModal(true);
        }
    }, [manageableRewards, otherRewards]);

    const testReward = (reward) => {
        dispatch(executeReward(reward.id));
    };

    // const handleMappingChange = useCallback((rewardId, sceneName) => {
    //     if (sceneName === '-') {
    //         dispatch(setRedemptionMapping(rewardId, null));
    //     } else {
    //         dispatch(setRedemptionMapping(rewardId, sceneName));
    //     }
    // }, [dispatch]);

    const handleToggleReward = useCallback(async (rewardId) => {
        const reward = redemptions.manageableRewards.find(r => r.id === rewardId);
        if (reward) {
            await dispatch(updateReward(rewardId, {
                is_enabled: !reward.is_enabled
            }));
        }
    }, [dispatch, redemptions ]);


    return (
        <>
            <Table responsive>
                <thead>
                <tr>
                    <th style={{ width: '3em'}}><i className="bi bi-eye-fill"/></th>
                    <th>Reward</th>
                    <th>OBS Scene</th>
                    <th style={{ width: '3em'}}>Test</th>
                </tr>
                </thead>
                <tbody>

                {(isFetchingRewards || isFetchingManageableRewards) ? (
                    Array(4).fill(0).map((v, i) => (
                        <tr key={`skeleton-${i}`}>
                            <td><Skeleton width="4em"/></td>
                            <td><Skeleton width="4em"/></td>
                            <td><Skeleton width="4em"/></td>
                            <td><Skeleton width="4em"/></td>
                        </tr>
                    ))

                ) : (

                    lastError ? (
                        <Alert variant={"danger"}>Failed to retrieve rewards</Alert>
                    ) : (
                        rewards.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="pt-4 pb-4 text-center">
                                    <em>No {showOther ? 'non-app' : 'manageable'} channel point redemptions found :(</em>
                                </td>
                            </tr>
                        ) : (
                            rewards.sort((a, b) => a.title.localeCompare(b.title)).map((reward, i) => (
                                <tr key={i}>
                                    <td className="pe-0">
                                        <HoverToolTip text={reward.is_enabled ? 'Disable reward' : 'Enable reward'} placement="top" delay={250}>
                                            <Form.Check type="switch"
                                                        checked={reward.is_enabled}
                                                        disabled={showOther}
                                                        onChange={() => handleToggleReward(reward.id)}/>
                                        </HoverToolTip>
                                    </td>
                                    <td className="reward-title">
                                        <HoverToolTip text="Manage Twitch reward settings" placement="top" delay={250}>
                                            <Button data-id={reward.id}
                                                    variant="link"
                                                    className="text-start ps-0 pe-0"
                                                    onClick={handleEditReward}
                                            >{reward.title}</Button>
                                        </HoverToolTip>
                                    </td>
                                    <td className="reward-mapping">

                                        <RewardMappingButton reward={reward} onClick={handleEditMapping} mapping={mappings[reward.id]} />

                                    </td>
                                    <td>
                                        <HoverToolTip text={'Trigger redemption'} placement="left" delay={250}>
                                            <Button variant="secondary" onClick={() => testReward(reward)} ><i className="bi bi-bullseye"/></Button>
                                        </HoverToolTip>
                                    </td>
                                </tr>
                            ))
                        )
                    )
                )}

                </tbody>
            </Table>
            <RewardModal reward={selectedReward} show={showUpdateModal} onClose={handleModalClose} />
            <OBSMappingModal reward={selectedReward} show={showMappingModal} onClose={handleMappingModalClose} />
        </>
    );
}