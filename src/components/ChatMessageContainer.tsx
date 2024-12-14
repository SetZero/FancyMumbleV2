import { Avatar, Box, Grid, List, Typography } from "@mui/material";
import React, { ReactElement, useEffect, useMemo, useState } from "react";
import { MemoChatMessage } from "./ChatMessage";
import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { TextMessage } from "../store/features/users/chatMessageSlice";
import { UsersState } from "../store/features/users/userSlice";
import { getProfileImage } from "../helper/UserInfoHelper";
import UserInfoPopover from "./UserInfoPopover";
import { useTranslation } from "react-i18next";

interface ChatMessageContainerProps {
	messages: TextMessage[]
}

interface GroupedMessages {
	user: UsersState | undefined,
	messages: Array<ReactElement>
}


const ChatMessageContainer = (props: ChatMessageContainerProps) => {
	const { t } = useTranslation();
	const userList = useSelector((state: RootState) => state.reducer.userInfo);
	const advancedSettings = useSelector((state: RootState) => state.reducer.frontendSettings.advancedSettings);
	const chatContainer: React.RefObject<HTMLDivElement> = React.createRef();
	const messagesEndRef: React.RefObject<HTMLDivElement> = React.createRef();
	const [userInfoAnchor, setUserInfoAnchor] = React.useState<HTMLElement | null>(null);
	const [currentPopoverUserId, setCurrentPopoverUserId]: any = useState(null);
	const [processedMessages, setProcessedMessages] = React.useState<TextMessage[]>([]);

	const scrollToBottom = () => {
		if (advancedSettings?.disableAutoscroll) {
			return;
		}
		new Promise(r => setTimeout(r, 100)).then(() => {
			console.log("End Ref", messagesEndRef.current);
			if(messagesEndRef.current) {
				messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
			} else {
				// workaround for when the ref is not set yet
				document.getElementById("msg-end-ref")?.scrollIntoView({ behavior: "smooth" });
			}
		});
	}

	useEffect(() => {
		setProcessedMessages(props.messages);
	}, [props.messages]);

	useEffect(() => {
		let messages = props.messages;
		if (messages.length > 0) {
			const scrollTrigger = (chatContainer?.current?.clientHeight ?? 0) * 1.2;
			const scrollPosition = (chatContainer?.current?.scrollHeight ?? 0) - (chatContainer?.current?.scrollTop ?? 0);
			const isWithinTrigger = scrollPosition >= scrollTrigger;
			const shouldScrollDown = advancedSettings?.alwaysScrollDown || isWithinTrigger;

			if (shouldScrollDown) {
				scrollToBottom();
			}
		}
	}, [processedMessages]);

	useEffect(() => {
		if (advancedSettings?.alwaysScrollDown) {
			scrollToBottom();
		}
	}, [props]); // Depend on props and userScrolled

	useEffect(() => {
		const images = Array.from(document.getElementsByTagName('img'));
		let loadedImagesCount = 0;

		const handleImageLoad = () => {
			loadedImagesCount++;

			if (loadedImagesCount === images.length) {
				scrollToBottom();
				console.log("All images loaded")
			}
		};

		images.forEach((img) => {
			if (img.complete) {
				handleImageLoad();
			} else {
				img.addEventListener('load', handleImageLoad);
			}
		});

		return () => {
			images.forEach((img) => {
				img.removeEventListener('load', handleImageLoad);
			});
		};
	}, [processedMessages]);

	const userIdToUserMap = useMemo(() => {
		if (!userList) return new Map<number, UsersState>();

		const map = new Map<number, UsersState>();
		userList.users.forEach(user => map.set(user.id, user));
		return map;
	}, [userList]);

	const memoizedMessages = useMemo(() => {
		if (!props) return [];

		let groupedMessages: Array<GroupedMessages> = [];
		let prevUser: UsersState | undefined = undefined;

		processedMessages.forEach((el) => {
			let currentUser = userIdToUserMap.get(el.sender.user_id);
			if (currentUser?.id !== prevUser?.id || groupedMessages.length === 0) {
				groupedMessages.push({ user: currentUser, messages: [] });
			}

			groupedMessages[Math.max(0, groupedMessages.length - 1)].messages.push(
				<MemoChatMessage
					messageId={el.timestamp}
					key={el.timestamp}
					message={el}
					onLoaded={() => { scrollToBottom(); }}
				/>
			);

			prevUser = currentUser;
		});

		return groupedMessages;
	}, [processedMessages]);

	const userIdToPopoverMap = useMemo(() => {
		const popoverMap = new Map<number, ReactElement>();
		userIdToUserMap.forEach((user, id) => {
			popoverMap.set(id,
				<UserInfoPopover
					anchorEl={userInfoAnchor}
					onClose={() => {
						setUserInfoAnchor(null);
						setCurrentPopoverUserId(null);
					}}
					userInfo={user}
				/>);
		});
		return popoverMap;
	}, [userIdToUserMap, userInfoAnchor]);

	const emptyChatMessageContainer = useMemo(() => {
		if (processedMessages.length === 0) {
			return (
				<Grid container sx={{ height: '100%', width: '100%', userSelect: 'none' }} justifyContent="center" alignItems="center">
					<Grid item>
						<Box sx={{ backgroundColor: 'transparent' }}>
							<Typography variant="h2" sx={{ color: 'transparent', textShadow: '2px 2px 3px rgba(50,50,50,0.5)', backgroundClip: 'text', backgroundColor: '#333', textAlign: "center" }}>{t("write something")}</Typography>
						</Box>
					</Grid>
				</Grid>
			);
		}
		return null;
	}, [processedMessages]);

	const chatElements = useMemo(() => {
		if (!memoizedMessages || processedMessages.length === 0) return null;

		return (<List sx={{ width: '100%', maxWidth: '100%' }}>
			{memoizedMessages.map((group, index) => (
				<Grid container className="message-root" key={index} sx={{ width: '100%', flexWrap: 'nowrap' }}>
					<Grid item >
						<Avatar
							sx={{ position: 'sticky', top: 10 }}
							className="avatar"
							src={getProfileImage(group.user?.id ?? 0, userList)}
							onClick={e => { setCurrentPopoverUserId(group.user?.id); setUserInfoAnchor(e.currentTarget); console.log(e.currentTarget) }}
							variant="rounded"
						/>
					</Grid>
					<Grid item sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
						{group.messages}
					</Grid>
				</Grid>

			))}
		</List>);
	}, [memoizedMessages, userList]);

	return (
		<Box sx={{ flex: 1, overflowY: 'auto' }} ref={chatContainer}>
			{chatElements}
			{emptyChatMessageContainer}
			{currentPopoverUserId && userIdToPopoverMap.get(currentPopoverUserId)}
			<div id="msg-end-ref" ref={messagesEndRef} />
		</Box>
	);
}

export default React.memo(ChatMessageContainer);