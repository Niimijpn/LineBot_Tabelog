const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');

const PORT = process.env.PORT || 3000;


const config = {
  channelAccessToken: '############',
  channelSecret: '##############',
};

const app = express();
app.get('/', async (_, res) => {
  return res.status(200).end();
});

app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events;
    const promises = [];

    events.forEach((event) => {
      if (event.type === 'message' && event.message.type === 'text') {
        promises.push(handleText(event.replyToken, event.message.text, event.source.userId));
        console.log(event.message.text);
      } else if (event.type === 'message' && event.message.type === 'location') {
        promises.push(handleLocation(event.replyToken, event.message.latitude, event.message.longitude));
        console.log(event.message.latitude, event.message.longitude);
      }
    });
    await Promise.all(promises);
    res.json({});
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

const lineClient = new line.Client(config);


async function handleText(replyToken, text, userId, numberOfShops = 5) {
  // テキストメッセージに対する処理
  async function searchHotPepper(keyword) {
    const apiKey = '###########';
    const apiUrl = 'https://webservice.recruit.co.jp/hotpepper/gourmet/v1/';
    const response = await axios.get(apiUrl, {
      params: {
        key: apiKey,
        keyword: keyword,
        format: 'json',
      },
    });
    return response.data.results.shop; // お店の情報が含まれているプロパティに応じて変更する
  }

  // ここでホットペッパーAPIを呼び出してお店の情報を取得し、ユーザーに返信するロジックを実装
  let replyMessages = [];

  // テキストメッセージに対する処理
  if (text === 'ホットペッパー') {
    replyMessages.push({
      "type": "text",
      text: 'ホットペッパーグルメのWebサイトです\nhttps://www.hotpepper.jp/'
    });
  } else if (text === '使い方') {
    replyMessages.push({ type: 'text', text: '🍴使い方🍴\n【キーワード検索】\n店名かな，店名，住所，駅名，お店ジャンルキャッチ，キャッチのフリーワード検索が可能です\n半角スペース区切りの文字列を渡すことでAND検索になります🥰\n例：名古屋 焼肉 4000円\n\n【位置情報から検索】\n位置情報を送信することで近くのお店（2km）が返信されます😆' });
  } else if (text === 'クレジット') {
    replyMessages.push({
      "type": "text",
      text: 'Powered by ホットペッパーグルメ Webサービス\nhttps://www.hotpepper.jp/ \n【画像提供：ホットペッパー グルメ】'
    });
  } else {
    // ホットペッパーAPIを使用してお店の情報を取得
    const shops = await searchHotPepper(text);

    if (shops.length > 0) {
      // // ホットペッパーAPIから取得した情報を整形
      const carouselContents = shops.slice(0, numberOfShops).map((shop) => {
        return {
          type: 'bubble',
          hero: {
            type: 'image',
            size: 'full',
            aspectRatio: '20:13',
            aspectMode: 'cover',
            url: shop.photo.pc.l,
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: shop.name,
                weight: 'bold',
                size: 'xl',
                wrap: true,
              },
              {
                "type": "box",
                "layout": "baseline",
                "margin": "md",
                "contents": [
                  {
                    "type": "text",
                    "text": "ジャンル：",
                    "size": "sm",
                    "color": "#999999",
                    "margin": "md",
                    "flex": 0
                  },
                  {
                    "type": "text",
                    "text": shop.genre.name,
                    "size": "sm",
                    "color": "#999999",
                    "margin": "md",
                    "flex": 0
                  }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "margin": "md",
                "contents": [
                  {
                    "type": "text",
                    "text": "営業時間：",
                    "size": "sm",
                    "color": "#999999",
                    "margin": "md",
                    "flex": 0
                  },
                  {
                    "type": "text",
                    "text": shop.open,
                    "size": "sm",
                    "color": "#999999",
                    "margin": "md",
                    "flex": 0
                  }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "margin": "md",
                "contents": [
                  {
                    "type": "text",
                    "text": "予算：",
                    "size": "sm",
                    "color": "#999999",
                    "margin": "md",
                    "flex": 0
                  },
                  {
                    "type": "text",
                    "text": shop.budget.name,
                    "size": "sm",
                    "color": "#999999",
                    "margin": "md",
                    "flex": 0
                  }
                ]
              },
              {
                "type": "box",
                "layout": "baseline",
                "margin": "md",
                "contents": [
                  {
                    "type": "text",
                    "text": "最寄駅：",
                    "size": "sm",
                    "color": "#999999",
                    "margin": "md",
                    "flex": 0
                  },
                  {
                    "type": "text",
                    "text": shop.station_name,
                    "size": "sm",
                    "color": "#999999",
                    "margin": "md",
                    "flex": 0
                  }
                ]
              },
              {
                "type": "text",
                "text": shop.address,
                "size": "sm",
                "color": "#666666",
                "wrap": true
              }

            ],
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'button',
                style: 'link',
                height: 'sm',
                action: {
                  type: 'uri',
                  label: '詳細を見る',
                  uri: shop.urls.pc,
                },
              },
            ],
          },
        };
      });
  
      replyMessages.push({
        type: 'flex',
        altText: 'this is a flex message',
        contents: {
          type: 'carousel',
          contents: carouselContents,
        },
      });
  
    replyMessages.push({ type: 'text', text: 'キーワード検索の結果です\n気になるお店は見つかりましたか？\nお役に立てれば嬉しいです🤩' });
  } else {
    replyMessages.push({ type: 'text', text: '該当するお店が見つかりませんでした😢\n店名かな，店名，住所，駅名，お店ジャンルキャッチ，キャッチのフリーワード検索(部分一致)が可能です\n半角スペース区切りの文字列を渡すことでAND検索になります🥰' });
  }
}

// ユーザーに返信
lineClient.replyMessage(replyToken, replyMessages);
}


async function handleLocation(replyToken, latitude, longitude, numberOfShops = 5) {
  // 位置情報に対する処理
  const shops = await searchNearbyShops(latitude, longitude);

  let replyMessages = [];


  if (shops.length > 0) {
    // ホットペッパーAPIから取得した情報を整形
    const carouselContents = shops.slice(0, numberOfShops).map((shop) => {
      return {
        type: 'bubble',
        hero: {
          type: 'image',
          size: 'full',
          aspectRatio: '20:13',
          aspectMode: 'cover',
          url: shop.photo.pc.l,
        },
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: shop.name,
              weight: 'bold',
              size: 'xl',
              wrap: true,
            },
            {
              "type": "box",
              "layout": "baseline",
              "margin": "md",
              "contents": [
                {
                  "type": "text",
                  "text": "ジャンル：",
                  "size": "sm",
                  "color": "#999999",
                  "margin": "md",
                  "flex": 0
                },
                {
                  "type": "text",
                  "text": shop.genre.name,
                  "size": "sm",
                  "color": "#999999",
                  "margin": "md",
                  "flex": 0
                }
              ]
            },
            {
              "type": "box",
              "layout": "baseline",
              "margin": "md",
              "contents": [
                {
                  "type": "text",
                  "text": "営業時間：",
                  "size": "sm",
                  "color": "#999999",
                  "margin": "md",
                  "flex": 0
                },
                {
                  "type": "text",
                  "text": shop.open,
                  "size": "sm",
                  "color": "#999999",
                  "margin": "md",
                  "flex": 0
                }
              ]
            },
            {
              "type": "box",
              "layout": "baseline",
              "margin": "md",
              "contents": [
                {
                  "type": "text",
                  "text": "予算：",
                  "size": "sm",
                  "color": "#999999",
                  "margin": "md",
                  "flex": 0
                },
                {
                  "type": "text",
                  "text": shop.budget.name,
                  "size": "sm",
                  "color": "#999999",
                  "margin": "md",
                  "flex": 0
                }
              ]
            },
            {
              "type": "box",
              "layout": "baseline",
              "margin": "md",
              "contents": [
                {
                  "type": "text",
                  "text": "最寄駅：",
                  "size": "sm",
                  "color": "#999999",
                  "margin": "md",
                  "flex": 0
                },
                {
                  "type": "text",
                  "text": shop.station_name,
                  "size": "sm",
                  "color": "#999999",
                  "margin": "md",
                  "flex": 0
                }
              ]
            },
            {
              "type": "text",
              "text": shop.address,
              "size": "sm",
              "color": "#666666",
              "wrap": true
            }

          ],
        },
        
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              style: 'link',
              height: 'sm',
              action: {
                type: 'uri',
                label: '詳細を見る',
                uri: shop.urls.pc,
              },
            },
          ],
        },
      };
    });

    replyMessages.push({
      type: 'flex',
      altText: 'this is a flex message',
      contents: {
        type: 'carousel',
        contents: carouselContents,
      },
    });
    replyMessages.push({ type: 'text', text: '現在地からの検索結果です\n気になるお店は見つかりましたか？\nお役に立てれば嬉しいです🤩' });
  } else {
    replyMessages.push({ type: 'text', text: '近くにお店がありませんでした（現在地から2km以内のお店）😢' });
  }

  // ユーザーに返信
  return lineClient.replyMessage(replyToken, replyMessages);
}

async function searchNearbyShops(latitude, longitude) {
  // ホットペッパーAPIを使用して近くのお店の情報を取得
  const apiKey = '#############';
  const apiUrl = 'https://webservice.recruit.co.jp/hotpepper/gourmet/v1/';
  const response = await axios.get(apiUrl, {
    params: {
      key: apiKey,
      lat: latitude,
      lng: longitude,
      range: 4, // 2km以内のお店を検索
      format: 'json',
    },
  });
  return response.data.results.shop;
}

app.listen(PORT)
console.log('run');