const ytdl = require('ytdl-core');

export default async (req, res) => {
    const {url} = req.query;
    const response = await ytdl.getInfo("https://www.youtube.com/watch?v=XQ-vkSTZmhM");
    if (response)
    {
        res.status(200).json({response});
    }
}