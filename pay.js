const { Wechaty } = require("wechaty");
const fetch = require('node-fetch')
const md5 = require('md5');
require('dotenv').config()
// const request = require("request");

function onScan(qrcode, status) {
  // 在控制台显示二维码
  require("qrcode-terminal").generate(qrcode, { small: true });

  const qrcodeImageUrl = [
    "https://api.qrserver.com/v1/create-qr-code/?data=",
    encodeURIComponent(qrcode),
  ].join("");

  console.log(qrcodeImageUrl);
}

// 登录
function onLogin(user) {
  console.log(`${user} login`);
}

// 登出
function onLogout(user) {
  console.log(`${user} logout`);
}

// sendPayment(0.01, 1562577831000)
function sendPayment(priceAmount,orderid,timestamp) {
  const sign = md5(orderid+timestamp+process.env.PASSWORD)
  console.log(priceAmount, orderid,timestamp,md5)
  const url = process.env.CALLBACK + "?amount="+priceAmount+"&orderid="+orderid+"&ts="+timestamp+"sign="+sign
  fetch(url)
}

// 消息来自 “微信支付”，信息格式为“微信支付收款0.01元”
async function onMessage(msg) {
  // 5分钟前的消息不处理
  if (msg.age() > 300) {
    return;
  }

 /* console.log("msg :>> ", JSON.stringify(msg, null, 2));
  
  console.log("contact: ", contact);
  const text = msg.text();
  console.log("text: ", text);
  
  console.log("msgDate: ", msgDate);

  // if (msg.type() !== bot.Message.Type.Attachment && !msg.self()) {
  //   console.log('由于与支付附件不匹配而丢弃的消息 :>> ', msg);
  //   return;
  // }
*/
  const contact = msg.talker();
  const text = msg.text();
  const msgDate = msg.date();

  // 非微信支付
  if (contact.name() !== "微信支付") {
    // 这里可以操作一些文本匹配，语音识别，图片处理之类等操作
    console.log("非微信支付", contact.name());
    return;
  } 

  const strs = text.split("元");
  console.log('strs: ', strs);
  if (strs.length >= 1) {
    const str = strs[0];
    let strid = '';
    const strids = strs[1].split("trans_id=");
    if(strids.length>1){
      strid = strids[1].split('&')[0];
    }
    const strs2 = str.split("微信支付收款");
    if (strs2.length >= 1) {
      console.log('strs2: ', strs2, ' date:',msgDate,' id:',strid);
      const priceStr = strs2[1];
      sendPayment(parseFloat(priceStr), strid,msgDate.getTime());
    }
  }
}

console.log(process.env.CALLBACK,process.env.PASSWORD,md5(process.env.CALLBACK))
// 实例化
const bot = new Wechaty();

// 注册事件
bot.on("scan", onScan);
bot.on("login", onLogin);
bot.on("logout", onLogout);
bot.on("message", onMessage);

bot
  .start()
  .then(() => console.log("Huamiao wechat bot Started."))
  .catch((e) => console.error(e));

