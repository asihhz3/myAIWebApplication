
export interface IToolFormat {
    type: string,
    function: {
        name: string,
        description: string,
        parameters: {
            type: string,
            properties: {
                [key : string]: { type: string, description: string }
            },
            required: string[]
        }
    }
}