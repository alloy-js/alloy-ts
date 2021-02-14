class AlloyError {

    static error (source: string, message: string): Error {

        return Error(`[${source}] ${message}`);

    }

    static missingAttribute (source: string, attribute: string): Error {

        return Error(`[${source}] Missing attribute: ${attribute}`);

    }

    static missingElement (source: string, element: string): Error {

        return Error(`[${source}] Missing element: <${element}>`);

    }

}

export {
    AlloyError
}
