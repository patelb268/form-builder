interface NotifyAction {
	action: 'notify';
	method: 'warn' | 'success' | 'inform';
	message: string;
	messageTranslate?: boolean;
}

export type Actions = NotifyAction;
