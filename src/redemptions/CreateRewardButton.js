import {Button} from "react-bootstrap";
import {useState} from "react";
import {useDispatch} from "react-redux";
import {clearCreateUpdateErrors} from "./RedemptionActions";
import RewardModal from "./RewardModal";

export default function CreateRewardButton() {
    const [show, setShow] = useState(false);
    const dispatch = useDispatch();

    const handleClose = () => {
        setShow(false);
        dispatch(clearCreateUpdateErrors());
    };

    const handleShow = () => setShow(true);

    return (
        <>
            <Button onClick={handleShow}><i className="bi bi-plus-circle"></i> Create Reward</Button>
            <RewardModal show={show} onClose={handleClose} reward={null} />
        </>
    )
}