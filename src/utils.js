require("dotenv").config();
const { Telegraf, Markup, session } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN;

const Bot = new Telegraf(BOT_TOKEN);

Bot.use(session());

const allowedCountryCodes = ["98","90"];


function convertToWesternDigits(str) {
    const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
    return str.replace(/[۰-۹]/g, (d) => persianDigits.indexOf(d));
  }

  async function doStart(ctx) {

    //* reset session
    if (!ctx.session) {
        ctx.session = {};
      }
    
      
      // simulate user registered before
      // const id = ctx.from.id;
    
      // if (id === 5875309834) {
      //   ctx.session.name = "Saeed!";
      //   ctx.session.phoneNumber = "09123456789";
      //   ctx.session.state = "waitforCommand";
      //   return await ctx.reply(`سلام ${ctx.session.name} عزیز، خوش آمدید.`);
      // }
    
      ctx.session.state = "waitForPhoneNumber";
    
      await ctx.reply(
        "برای شروع ثبت نام نمایید",
        Markup.keyboard([Markup.button.contactRequest("📱 ارسال شماره تلفن")])
          .oneTime()
          .resize()
      );
}

async function requestCity(ctx) {
    ctx.session.state = "waitForCity";
    return await ctx.reply(
        "لطفا شهر مبدا را انتخاب کنید",
        Markup.inlineKeyboard([
        Markup.button.callback("🇹🇷آلانیا", "alanya"),
        Markup.button.callback("🇹🇷آنتالیا", "antalya"),
        Markup.button.callback("🇹🇷استانبول", "istanbul"),
        Markup.button.callback("🇮🇷 تهران", "tehran"),
        ])
        .oneTime()
        .resize()
    );
}

async function requestName(ctx) {
    ctx.session.state = "waitForName";
    return await ctx.reply("لطفا نام خود را وارد نمایید");
}

async function getContact(ctx){
  if (ctx.session.state !== "waitForPhoneNumber") {
    return;
  }
  
  const countryCode = ctx.message.contact.phone_number.slice(0, 2);
  
  // if (!allowedCountryCodes.includes(countryCode)) {
  //   return await ctx.reply("در حال حاضر از کشور شما پشتیبانی نمی شود.");
  // }

  ctx.session.state = "waitforCommand";
  ctx.session.phoneNumber = ctx.message.contact.phone_number;
  
  
  return await ctx.reply(
    "ممنون از شما از منوی زیر گزینه مورد نظر خود را انتخاب کنید",
    Markup.removeKeyboard()
  );
}

async function requestType(ctx) {
  ctx.session.state = "waitForType";
  ctx.editMessageText(
    "لطفا نوع بار را انتخاب کنید",
    Markup.inlineKeyboard([
      Markup.button.callback("📄 مدارک", "مدارک"),
      Markup.button.callback("👕 لباس", "لباس"),
      Markup.button.callback("👜 کیف و کفش", "کیف و کفش"),
    ])
      .oneTime()
      .resize()
  );
}

async function requestWeight(ctx) {
  ctx.session.state = "waitForWeight";
  return ctx.reply("لطفا وزن تقریبی بار خود را به کیلوگرم وارد کنید. ");
}

async function getCity(ctx,city) {

  ctx.session.city = city;
  requestDestination(ctx);
  
}

async function getDestination(ctx,destination) {
  ctx.session.destination = destination;
  requestType(ctx);
}

async function requestDestination(ctx) {
  ctx.session.state = "waitForDestination";
  
  return await ctx.editMessageText(
    "لطفا شهر مقصد را انتخاب کنید",
    Markup.inlineKeyboard( [
      Markup.button.callback("🇹🇷آلانیا", "alanyaD",ctx.session.city === 'آلانیا' ? true:false),
      Markup.button.callback("🇹🇷آنتالیا", "antalyaD",ctx.session.city === 'آنتالیا' ? true:false ),
      Markup.button.callback("🇹🇷استانبول", "istanbulD",ctx.session.city === 'استانبول' ? true:false),
      Markup.button.callback("🇮🇷 تهران", "tehranD",ctx.session.city === 'تهران' ? true:false),
    ])
      .oneTime()
      .resize()
  );
}

async function getType(ctx,type) {
  ctx.session.type = type;
  requestWeight(ctx);
}

async function getWeight(ctx) {

   
    // Normalize weight
    const weight = parseFloat(convertToWesternDigits(ctx.message.text));
    
    // weight should be a number
    if (isNaN(weight)) {
      return await ctx.reply("مقدار نامعتبر است لطفا مجددا تلاش کنید");
    }

    // weight should be between 0 and 30
    if (weight < 0 || weight > 30) {
      return await ctx.reply("مقدار نامعتبر است لطفا مجددا تلاش کنید");
    }

    // Set the weight
    ctx.session.weight = ctx.message.text;
    
    // Request price
    
    requestPrice(ctx);
}

async function requestPrice(ctx) {
  ctx.session.state = "waitForPrice";
  return await ctx.reply("لطفا دستمزد پیشنهادی خود را به تومان وارد کنید. ");
}

async function getPrice(ctx) {
// Normalize price
const price = parseFloat(convertToWesternDigits(ctx.message.text));
    
// Add digit grouping
const formattedPrice = price.toLocaleString();

// set price
ctx.session.price = formattedPrice;

requestConfirmation(ctx);

}

async function requestConfirmation(ctx){
// Request confirmation
ctx.session.state = "waitForConfirmation";
return await ctx.reply(
    "نام : " +
      ctx.session.name +
      "\n" +
      "شهر مبدا : " +
      ctx.session.city +
      "\n" +
      "شهر مقصد : " +
      ctx.session.destination +
      "\n" +
      "نوع بار : " +
      ctx.session.type +
      "\n" +
      "وزن بار : " +
      ctx.session.weight +
      "کیلوگرم" +
      "\n" +
      "دستمزد پیشنهادی : " +
      ctx.session.price +
      "تومان" +
      "\n\n" +
      "آیا اطلاعات صحیح است؟",
    Markup.keyboard([["✅ بله", "❌ خیر"]])
      .oneTime()
      .resize()
  );
}

async function requestPayment(ctx) {
  ctx.session.state = "waitforCommand";
  return await ctx.reply(
    "لطفا هنگام پرداخت شماره تلفن را وارد نمایید\n\n" + ctx.session.phoneNumber,
    Markup.inlineKeyboard([
      Markup.button.url("پرداخت", "https://forush.co/33808/259364"),
      Markup.button.callback("ارسال به کانال", "sendToChannel")
    ])
  );
}

async function sendToChannel(text) {

  
    const inlineKeyboard = [
    Markup.button.callback("ارسال پیغام", "sendmessage")
    ];

  // return await Bot.telegram.sendMessage("@barmosaferiTR",text,{parse_mode:"HTML",reply_markup:{inline_keyboard: [inlineKeyboard]}});
  return await Bot.telegram.sendMessage("@barmosaferiTR",text,{parse_mode:"HTML"});
}


exports.Bot = Bot;
exports.convertToWesternDigits = convertToWesternDigits;
exports.doStart = doStart;
exports.requestCity = requestCity;
exports.requestName = requestName;
exports.requestPayment = requestPayment;
exports.getCity = getCity;
exports.getType = getType;
exports.getWeight = getWeight;
exports.getPrice = getPrice;
exports.getContact = getContact;
exports.getDestination = getDestination;
exports.sendToChannel = sendToChannel;


