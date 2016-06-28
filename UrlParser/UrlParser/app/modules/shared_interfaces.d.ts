
interface IParsedUrl {
    schema: string;
    host: string;
    path: string;
    query: string;
    params: { [key: string]: string };
}