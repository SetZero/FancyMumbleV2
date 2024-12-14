import { useSelector } from "react-redux";
import { RootState } from "../store/store";
import { ChannelState } from "../store/features/users/channelSlice";

export function getChannelImageFromDescription(channel: ChannelState): string | undefined {
    const channelList = useSelector((state: RootState) => state.reducer.channel);

    if (channelList[channel.channel_id] !== undefined) {
        let lastImage = channelList[channel.channel_id].channelImage
        return `url(${lastImage})`;
    }
}