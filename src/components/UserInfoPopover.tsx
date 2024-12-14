import {  Popover,  } from "@mui/material";
import { UsersState } from "../store/features/users/userSlice";
import "./styles/UserInfo.css";
import "./styles/common.css"
import UserInfo from "./UserInfo";

interface UserInfoProps {
    anchorEl: HTMLElement | null;
    userInfo: UsersState | undefined;
    onClose: () => void;
}

function UserInfoPopover(props: UserInfoProps) {
    return (
        <Popover
            open={Boolean(props.anchorEl)}
            anchorEl={props.anchorEl}
            onClose={props.onClose}
            anchorOrigin={{
                vertical: 'center',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'center',
                horizontal: 'left',
            }}
        >
          <UserInfo userInfo={props.userInfo} />
        </Popover>
    );
}

export default UserInfoPopover;