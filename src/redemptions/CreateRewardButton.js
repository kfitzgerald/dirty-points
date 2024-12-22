import {Button} from "react-bootstrap";
import {useState} from "react";
import {useDispatch} from "react-redux";
import {clearCreateUpdateErrors} from "./RedemptionActions";
import RewardModal from "./RewardModal";

export default function CreateRewardButton({ disabled=false }) {
    const [show, setShow] = useState(false);
    const dispatch = useDispatch();

    const handleClose = () => {
        setShow(false);
        dispatch(clearCreateUpdateErrors());
    };

    const handleShow = () => setShow(true);

    return (
        <>
            <Button onClick={handleShow} disabled={disabled}><i className="bi bi-plus-circle"/> Create Reward</Button>
            <RewardModal show={show} onClose={handleClose} reward={null} />
        </>
    )
}