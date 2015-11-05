import dispatcher from '../appdispatcher';
import {ILoginErrors, ICredential} from "../stores/loginstore";

export default {
    initApi(api: any): void {
        dispatcher.dispatch('initApi', api);
    },
    setCurrentChatThread(chatThread: string): void {
        dispatcher.dispatch('setCurrentChatThread', chatThread);
    },
    friendSelected(friend: any): void {
        dispatcher.dispatch('friendSelected', friend);
    }
};