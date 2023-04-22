const ytdl = require('ytdl-core');

export default async (req, res) => {
    const {url} = req.body;
    const response = await ytdl.getInfo(url);
    if (response)
    {
        res.status(200).json({response});
    }
}