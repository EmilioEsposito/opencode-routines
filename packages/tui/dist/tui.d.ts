type TuiApi = {
    route: {
        current: {
            name: string;
            params?: Record<string, any>;
        };
        navigate?: (name: string, params?: Record<string, unknown>) => void;
    };
    client: {
        session: {
            prompt: (input: any) => Promise<unknown>;
        };
    };
    ui: {
        dialog: {
            replace: (render: () => any) => void;
            clear: () => void;
        };
        DialogAlert: (props: {
            title: string;
            message: string;
        }) => any;
        DialogPrompt: (props: {
            title: string;
            placeholder?: string;
            onConfirm?: (value: string) => void;
        }) => any;
        DialogSelect: (props: {
            title: string;
            options: Array<{
                title: string;
                value: string;
                description?: string;
                footer?: string;
            }>;
            onSelect?: (option: {
                value: string;
            }) => void;
        }) => any;
        toast: (input: {
            variant?: "info" | "success" | "warning" | "error";
            title?: string;
            message: string;
        }) => void;
    };
    lifecycle: {
        onDispose: (fn: () => void) => void;
    };
    keymap: {
        registerLayer: (input: {
            commands: any[];
            bindings?: any[];
        }) => unknown;
    };
};
type TuiPlugin = (api: TuiApi, options?: Record<string, unknown>, meta?: Record<string, unknown>) => Promise<void>;
declare const _default: {
    id: string;
    tui: TuiPlugin;
};
export default _default;
