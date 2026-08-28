export const parseTemplate = (template, variables) => {

    let result = template;

    for (const key in variables) {

        const placeholder = `{{${key}}}`;

        result = result.replaceAll(
            placeholder,
            variables[key]
        );

    }

    return result;

};