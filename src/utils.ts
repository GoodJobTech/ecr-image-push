import internal from "stream";

export async function streamToString(stream: internal.Readable|null): Promise<string> {
    if (!stream) {
        return '';
    }

    const chunks = [];

    for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
    }

    return Buffer.concat(chunks).toString("utf-8");
}