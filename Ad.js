/*******************************
脚本功能：网易云音乐 最高音质
使用声明：此脚本仅供学习与交流，请在下载使用24小时内删除！请勿在中国大陆转载与贩卖！
*******************************
[rewrite_local]
# > 喜马拉雅,会员.大师课,儿童+音效&音质,去广告,界面优化+++
https?:\/\/.+((ximalaya)|(xmcdn)).+(mobile-user\/v2|mobile-web|queryCategoryPageData|discovery-feed\/v4|vip\/v1\/recommand|product\/detail\/v1|mobile\/v1\/album|playpage|album\/price\/ts|mobile\/user\/member|freeListenTabStyle).*$ url script-response-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js
^https?:\/\/.+((ximalaya)|(xmcdn)).+\/[a-z]{6}\-[a-z]{8}\/track\/(v[0-9])\/[a-zA-Z]+\/ts.*$ url script-request-header https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js
^https:\/\/mobile\.ximalaya\.com\/mobile-playpage\/(?:track\/v4\/baseInfo|playpage\/recommendContentV2|playpage\/tabs\/v2) url script-request-header https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js
https?:\/\/(mobile(hera)?|m(ob)?wsa|m)\.ximalaya\.com\/mobile(-user\/v\d\/homePage|-playpage\/(track\/v\d\/baseInfo|playpage\/(tabs\/v\d|recommend(\/resource\/allocation|ContentV\d)))|\/(album\/paid\/info|playlist\/album\/new)|\/v\d\/album\/track) url script-response-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js
https?:\/\/(mobile(hera)?|m(ob)?wsa|m)\.ximalaya\.com\/business-vip-(presale-mobile-web\/page|level-h5-web\/api\/(gift\/detail|profile)|welfare-mobile-web\/welfare\/module\/exclusive\/list) url script-response-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js
https?:\/\/(mobile(hera)?|m(ob)?wsa|m)\.ximalaya\.com\/discovery-(category\/customCategories|feed\/v\d\/(freeListenTab\/queryCardList|mix)|ranking-web\/v\d\/ranking\/concreteRankList) url script-response-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js
https?:\/\/(mobile(hera)?|m(ob)?wsa|m)\.ximalaya\.com\/(browsing-history-business\/browsing\/history\/query|focus-mobile\/focusPic\/info|nyx\/history\/query\/(detail|id\/list)|product\/detail\/v\d\/basicInfo\/dynamic|subscribe\/v\d\/subscribe\/comprehensive\/rank|vip\/(feed\/v1\/mix|v\d\/recommand)) url script-response-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js
https?:\/\/search(wsa)?\.ximalaya\.com\/(hub\/)?(guideWordV\d|hotWord(V\d|Billboard\/card)) url script-response-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js
https?:\/\/(mobile(hera)?|m(ob)?wsa)\.ximalaya\.com\/(mobile-playpage\/track|mobile\/quickplay) url script-request-header https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js
^https?:\/\/mobile.ximalaya.com\/fmobile-user\/homePage\/ url script-response-body https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js
^https?:\/\/.+ximalaya.com\/(fmobile-track\/fmobile\/track\/playpage|mobile\/track\/pay)\/ url script-request-header https://raw.githubusercontent.com/BOBOLAOSHIV587/zTest/main/Ad.js



[mitm]
hostname = 183.201.114.*,101.91.135.*,101.91.133.*,101.91.134.*,adse.ximalaya.com,61.170.88.*,101.91.134.*,42.56.64.*,*.xmcdn.com, *.ximalaya.com, 61.172.194.*,180.153.*.*,180.153.255.*, 180.153.140.*,180.153.250.*,114.80.99.*,114.80.139.2*,61.162.174.*,119.188.123.*,59.83.227.*, 114.80.161.29,1.62.62.64,1.194.255.171, 23.236.99.89, 36.99.200.135, 42.81.4.198, 42.81.26.128, 42.81.120.58, 43.152.24.12, 43.152.24.18, 43.152.25.127, 43.152.29.38, 43.175.16.34, 43.175.22.25, 43.175.44.15, 49.7.69.197, 49.51.224.95, 101.33.11.32, 101.33.11.106, 101.33.20.34, 101.33.29.110, 103.105.60.99, 140.249.84.135, 140.249.85.189, 150.109.90.80, 150.109.91.35, 150.138.47.94, 150.138.136.145, 203.205.13*.*, 203.205.250.*, 211.152.137.*, 47.100.227.85, 61.164.145.12, 106.41.204.126, 112.80.180.72, 112.98.170.228, 112.99.146.108, 118.25.119.177, 223.111.231.198, 120.22*.2*.*, 43.132.8*.*, 101.33.27.*, 43.141.11.*,101.89.53.*,36.131.221.*,111.42.194.*,adse.ximalaya.com,36.131.221.*,112.84.131.*,111.6.56.*,111.6.56.228,*.xmcdn.com,120.232.165.228,43.159.71.*,ulogs.umeng.com,www.taobao.com,43.132.81.*,101.33.27.*,114*0.*,61.172.1*.*,43.141.11.*,114.80.99.86,180.153.255.*,114.80.99.*,*.mysteel.*,61.172.194.196,180.153.*.*,*xima*,*xmcdn*,*.ximalaya.com,*.xmcdn.com,180.153.255.*,180.153.140.*,180.153.250.*,114.80.99.*,114.80.139.237,114.80.161.29,1.62.62.64,51*.com,1.194.255.171, 23.236.99.89, 36.99.200.135,42.81.4.198,42.81.26.128,42.81.120.58,43.132.80.77,43.132.83.175,43.132.84.11,43.152.24.12,43.152.24.18,43.152.25.127,43.152.29.38,43.175.16.34,43.175.22.25,43.175.44.15,49.7.69.197,49.51.224.95,101.33.11.32,101.33.11.106,101.33.20.34,101.33.29.110,103.105.60.99,114.80.99.90,114.80.99.70,114.80.99.71, 114.80.99.89,114.80.99.91,114.80.99.88, 114.80.99.87,140.249.84.135,140.249.85.189,150.109.90.80,150.109.91.35,150.138.47.94,150.138.136.145,203.205.136.87,203.205.136.100,203.205.136.102,203.205.136.159,203.205.137.27,203.205.137.87,203.205.137.241,203.205.250.111,203.205.250.113,211.152.137.25,ulogs.umeng.com,passport.ximalaya.com,mobile.ximalaya.com, 101.91.13*

*******************************/


"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const dayjs = require("dayjs");
function formatMusicItem(_) {
    return {
        id: _.id ?? _.trackId,
        artist: _.nickname,
        title: _.title,
        album: _.albumTitle,
        duration: _.duration,
        artwork: _.coverPath?.startsWith("//")
            ? `https:${_.coverPath}`
            : _.coverPath,
    };
}
function formatAlbumItem(_) {
    return {
        id: _.albumId ?? _.id,
        artist: _.nickname,
        title: _.title,
        artwork: _.coverPath?.startsWith("//")
            ? `https:${_.coverPath}`
            : _.coverPath,
        description: _.intro ?? _.description,
        date: _.updatedAt ? dayjs(_.updatedAt).format("YYYY-MM-DD") : null,
    };
}
function formatArtistItem(_) {
    return {
        name: _.nickname,
        id: _.uid,
        fans: _.followersCount,
        description: _.description,
        avatar: _.logoPic,
        worksNum: _.tracksCount,
    };
}
function paidAlbumFilter(raw) {
    return !raw.priceTypes?.length;
}
function paidMusicFilter(raw) {
    return raw.tag === 0 || raw.isPaid === false || parseFloat(raw.price) === 0;
}
async function searchBase(query, page, core) {
    return (await axios_1.default.get("https://www.ximalaya.com/revision/search/main", {
        params: {
            kw: query,
            page: page,
            spellchecker: true,
            condition: "relation",
            rows: 20,
            device: "iPhone",
            core,
            paidFilter: true,
        },
    })).data;
}
async function searchMusic(query, page) {
    const res = (await searchBase(query, page, "track")).data.track;
    return {
        isEnd: page >= res.totalPage,
        data: res.docs.filter(paidMusicFilter).map(formatMusicItem),
    };
}
async function searchAlbum(query, page) {
    const res = (await searchBase(query, page, "album")).data.album;
    return {
        isEnd: page >= res.totalPage,
        data: res.docs.filter(paidAlbumFilter).map(formatAlbumItem),
    };
}
async function searchArtist(query, page) {
    const res = (await searchBase(query, page, "user")).data.user;
    return {
        isEnd: page >= res.totalPage,
        data: res.docs.map(formatArtistItem),
    };
}
async function getAlbumInfo(albumItem, page = 1) {
    const res = await axios_1.default.get("https://www.ximalaya.com/revision/album/v1/getTracksList", {
        params: {
            albumId: albumItem.id,
            pageNum: page,
            pageSize: 50,
        },
    });
    return {
        isEnd: page * 50 >= res.data.data.trackTotalCount,
        albumItem: {
            worksNum: res.data.data.trackTotalCount
        },
        musicList: res.data.data.tracks.filter(paidMusicFilter).map((_) => {
            const r = formatMusicItem(_);
            r.artwork = albumItem.artwork;
            r.artist = albumItem.artist;
            return r;
        }),
    };
}
async function search(query, page, type) {
    if (type === "music") {
        return searchMusic(query, page);
    }
    else if (type === "album") {
        return searchAlbum(query, page);
    }
    else if (type === 'artist') {
        return searchArtist(query, page);
    }
}
async function getMediaSource(musicItem, quality) {
    if (quality !== "standard") {
        return;
    }
    const data = await axios_1.default.get("https://www.ximalaya.com/revision/play/v1/audio", {
        params: {
            id: musicItem.id,
            ptype: 1,
        },
        headers: {
            referer: `https://www.ximalaya.com/sound/${musicItem.id}`,
            accept: "*/*",
            "accept-encoding": "gzip, deflate, br",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.61",
        },
    });
    return {
        url: data.data.data.src,
    };
}
async function getArtistWorks(artistItem, page, type) {
    if (type === "music") {
        const res = (await axios_1.default.get("https://www.ximalaya.com/revision/user/track", {
            params: {
                page,
                pageSize: 30,
                uid: artistItem.id,
            },
        })).data.data;
        return {
            isEnd: res.page * res.pageSize >= res.totalCount,
            data: res.trackList.filter(paidMusicFilter).map((_) => ({
                ...formatMusicItem(_),
                artist: artistItem.name,
            })),
        };
    }
    else {
        const res = (await axios_1.default.get("https://www.ximalaya.com/revision/user/pub", {
            params: {
                page,
                pageSize: 30,
                uid: artistItem.id,
            },
        })).data.data;
        return {
            isEnd: res.page * res.pageSize >= res.totalCount,
            data: res.albumList.filter(paidAlbumFilter).map((_) => ({
                ...formatAlbumItem(_),
                artist: artistItem.name,
            })),
        };
    }
}
async function getTopLists() {
    const resHost = (await axios_1.default.get(`
    https://m.ximalaya.com/revision/rank/v4/element?rankingId=100006`)).data;
    const Host = {
        title: "热榜",
        data: resHost.data.rankList[0].albums.map((_) => {
            return {
                id: _.id,
                title: _.albumTitle,
                description: _.description,
                coverImg: `https://imagev2.xmcdn.com/${_.cover}!op_type=3&columns=144&rows=144&magick=webp`
            };
        }),
    };
    return [Host];
}
async function getTopListDetail(topListItem) {
    const res = (await axios_1.default.get(`https://m.ximalaya.com/m-revision/common/album/queryAlbumTrackRecordsByPage?albumId=${topListItem.id}&page=1&pageSize=100&asc=true`)).data;
    return {
        ...topListItem,
        musicList: res.data.trackDetailInfos.map(_ => {
            return {
                id: _.id,
                albumId: _.trackInfo.albumId,
                title: _.trackInfo.title,
            };
        }),
    };
    console.log(res);
}
module.exports = {
    platform: "喜马拉雅",
    version: "0.1.20",
    order: 10,
    srcUrl: "http://adad23u.appinstall.life/dist/xmly/index.js",
    cacheControl: "no-cache",
    search,
    getAlbumInfo,
    getMediaSource,
    getArtistWorks,
    getTopLists,
    getTopListDetail
};

