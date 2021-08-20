const { Wechaty } = require("wechaty");
const { Heartbeat } =require('wechaty-plugin-contrib')
const fetch = require('node-fetch')
const md5 = require('md5')
var QRCode = require('qrcode')
 

require('dotenv').config()

/* enum ScanStatus {
  Unknown   = 0,
  Cancel    = 1,
  Waiting   = 2,
  Scanned   = 3,
  Confirmed = 4,
  Timeout   = 5,
}*/

let firstLogin = true
function onScan(qrcode, status) {
  if(status==2||firstLogin){
  // 在控制台显示二维码
  QRCode.toString(qrcode,{type:'terminal',scale:2}, function (err, url) {
    console.log(url)
  })
  QRCode.toFile(process.env.OUTPUT+'/login.png',qrcode)
  if(firstLogin==false){
    console.log("need rescan!!!!!!")
    callRescan()
  }
}
if(status==3){
  firstLogin = false
}
  console.log(status);
}

// 登录
let selfUser = null
function onLogin(user) {
  selfUser = user
  console.log(`${user} login`);
}

// 登出
function onLogout(user) {
  console.log(`${user} logout`);
}

// sendPayment(0.01, 1562577831000)
function sendPayment(priceAmount,orderid,timestamp) {
  const sign = md5(orderid+timestamp+process.env.PASSWORD)
  console.log(priceAmount, orderid,timestamp,sign)
  const url = process.env.CALLBACK + "?amount="+priceAmount+"&orderid="+orderid+"&ts="+timestamp+"&sign="+sign
  console.log("calling:",url)
  fetch(url)
}

function callRescan(){
  const url = process.env.RESCAN
   console.log("calling:",url)
  if(url){
   
    fetch(url)
  }
  else
    console.log("RESCAN not set")
}
// 消息来自 “微信支付”，信息格式为“微信支付收款0.01元”
async function onMessage(msg) {
  // 5分钟前的消息不处理
  if (msg.age() > 300) {
    return;
  }

 //console.log("msg :>> ", JSON.stringify(msg, null, 2));
  
 /*  console.log("contact: ", contact);
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

  if(contact.self()){
    console.log("self message:",text)
  }else{
    console.log(contact.name()," say:",text)
  }
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

const config = {
  contact: 'filehelper',    // default: filehelper - Contact id who will receive the emoji
  emoji: {
    heartbeat: '[爱心]',    // default: [爱心] - Heartbeat emoji
  },
  intervalSeconds: 10, // Default: 1 hour - Send emoji for every 1 hour
}
Wechaty.use(Heartbeat(config))
// 注册事件
bot.on("scan", onScan);
bot.on("login", onLogin);
bot.on("logout", onLogout);
bot.on("message", onMessage);
bot.on("error",(err)=>{console.log(err)});


bot
  .start()
  .then(() => console.log("Huamiao wechat bot Started."))
  .catch((e) => console.error(e));

