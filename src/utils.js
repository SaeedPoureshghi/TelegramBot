require("dotenv").config();
const { Telegraf, Markup, session } = require("telegraf");
const { getUser, insertUser, insertOrder, getOrders, getOrderDetails } = require("./db");

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

      const user_id = ctx.from.id;

      const user = await getUser(user_id);
      if (user) {
        ctx.session.name = user.username;
        ctx.session.phoneNumber = user.phone;
        ctx.session.state = "waitforCommand";
        return await ctx.reply(`سلام ${ctx.session.name} عزیز، خوش آمدید.`,Markup.removeKeyboard());
      }else{
        ctx.session.state = "waitForPhoneNumber";
        await ctx.reply(
          "برای شروع ثبت نام نمایید",
          Markup.keyboard([Markup.button.contactRequest("📱 ارسال شماره تلفن")])
            .oneTime()
            .resize()
        );
      }

    
      
      // simulate user registered before
      // const id = ctx.from.id;
    
      // if (id === 5875309834) {
      //   ctx.session.name = "Saeed!";
      //   ctx.session.phoneNumber = "09123456789";
      //   ctx.session.state = "waitforCommand";
      //   return await ctx.reply(`سلام ${ctx.session.name} عزیز، خوش آمدید.`);
      // }
    
      // ctx.session.state = "waitForPhoneNumber";
    
      // await ctx.reply(
      //   "برای شروع ثبت نام نمایید",
      //   Markup.keyboard([Markup.button.contactRequest("📱 ارسال شماره تلفن")])
      //     .oneTime()
      //     .resize()
      // );
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

  if (!ctx.session){
    return;
  }

  if (ctx.session.state !== "waitForPhoneNumber") {
    return;
  }
  
  // const countryCode = ctx.message.contact.phone_number.slice(0, 2);
  
  // if (!allowedCountryCodes.includes(countryCode)) {
  //   return await ctx.reply("در حال حاضر از کشور شما پشتیبانی نمی شود.");
  // }

  ctx.session.state = "waitforCommand";
  ctx.session.phoneNumber = ctx.message.contact.phone_number;
  ctx.session.name = ctx.from.first_name;

  await insertUser(ctx.from.id,ctx.message.contact.phone_number,ctx.from.first_name)
  .then(async (res) => {
    return await ctx.reply(`سلام ${ctx.session.name} عزیز، خوش آمدید.`,Markup.removeKeyboard());
  })
  .catch(async (err) => {
    return await ctx.reply(`متاسفانه مشکلی در ثبت نام رخ داده است. لطفا مجددا تلاش کنید.`);
  });
    
  
  // return await ctx.reply(
  //   "ممنون از شما از منوی زیر گزینه مورد نظر خود را انتخاب کنید",
  //   Markup.removeKeyboard()
  // );
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

  
  await insertOrder(ctx.from.id,ctx.session.city,ctx.session.destination,ctx.session.type,ctx.session.weight,ctx.session.price,"draft")
  .then(async (res) => {
    ctx.session.orderId = res;
  })
  .catch(async (err) => {
    console.log(err);
  });
// Request confirmation
ctx.session.state = "waitForConfirmation";

const flag = ctx.session.city === "تهران" ? "🇮🇷" : "🇹🇷";
const flagD = ctx.session.destination === "تهران" ? "🇮🇷" : "🇹🇷";
const typeIcon = ctx.session.type === "مدارک" ? "📄" : ctx.session.type === "لباس" ? "👕" : "👜";
const weightIcon = "⚖️";
const priceIcon = "💰";
const phoneIcon = "📱";

const inlinekeyboard = [
  Markup.button.callback("حذف سفارش", `delete:${ctx.session.orderId}`),
  //confirm order
  Markup.button.callback("تایید و ارسال به کانال", `confirm:${ctx.session.orderId}`)
];

return await ctx.reply(
    "نام : " +
      ctx.session.name +
      "\n" +
      "شهر مبدا : " +
      flag + " " + ctx.session.city +
      "\n" +
      "شهر مقصد : " +
      flagD + " " + ctx.session.destination +
      "\n" +
      "نوع بار : " +
      typeIcon + " " + ctx.session.type +
      "\n" +
      "وزن بار : " +
      weightIcon + " " + ctx.session.weight +
      "کیلوگرم" +
      "\n" +
      "دستمزد پیشنهادی : " +
      priceIcon + " " + ctx.session.price +
      "تومان" +
      "\n\n" ,
      {parse_mode:"HTML",reply_markup:{inline_keyboard: [inlinekeyboard]}}
    
  );
}

async function requestOrders(ctx) {
   const orders = await getOrders(ctx.from.id);

    if (orders.length === 0) {
      return await ctx.reply("شما هیچ سفارشی ثبت نکرده اید.");
    }


    orders.forEach(order => {
      returnOrder(ctx,order.id);
    });
    // const inlinekeyboard = [];
    // orders.forEach( order => {
    //   const flag = order.city === "تهران" ? "🇮🇷" : "🇹🇷";
    //   const flagD = order.destination === "تهران" ? "🇮🇷" : "🇹🇷";
    //   const typeIcon = order.type === "مدارک" ? "📄" : order.type === "لباس" ? "👕" : "👜";
  

    //   inlinekeyboard.push(Markup.button.callback(`${typeIcon} ${order.type} از ${order.city}${flag} به ${order.destination}${flagD}`, `order:${order.id}`));
    // });
    // return await ctx.reply("لیست سفارشات شما", Markup.inlineKeyboard(inlinekeyboard));
  }

  async function returnOrder(ctx, order_id) {
    const order = await getOrderDetails(order_id);

    const flag = order.city === "تهران" ? "🇮🇷" : "🇹🇷";
    const flagD = order.destination === "تهران" ? "🇮🇷" : "🇹🇷";
    const typeIcon = order.type === "مدارک" ? "📄" : order.type === "لباس" ? "👕" : "👜";
    const weightIcon = "⚖️";
    const priceIcon = "💰";
    const phoneIcon = "📱";
    
    const text = "بار مسافری\n\n" +  
      `<b> نام صاحب بار:</b> ${ctx.session.name}\n\n` +
      `<b>شهر مبدا:</b> ${order.city}${flag}\n\n` +
      `<b>شهر مقصد:</b> ${order.destination}${flagD}\n\n` +
      `<b>نوع بار:</b> ${typeIcon} ${order.type}\n\n` +
      `<b>وزن تقریبی:</b> ${weightIcon} ${order.weight} کیلوگرم\n\n` +
      `<b>دستمزد پرداختی:</b> ${priceIcon} ${order.price} تومان\n\n` +
      `${phoneIcon} +${ctx.session.phoneNumber}\n\n` + 
      `<b>وضعیت:</b> ${order.status === "draft" ? "پیش نویس" : "تایید شده"}\n\n`;

      const inlinekeyboard = order.status === "draft" ? [
        Markup.button.callback("حذف سفارش", `delete:${order.id}`),
        //confirm order
        Markup.button.callback("تایید و ارسال به کانال", `confirm:${order.id}`),
      ] : [Markup.button.callback("بایگانی سفارش", `archive:${order.id}`),];
      
    return await ctx.reply(text,{parse_mode:"HTML",reply_markup:{inline_keyboard: [inlinekeyboard]}});
    // return await ctx.editMessageText(text,{parse_mode:"HTML",reply_markup:{inline_keyboard: [inlinekeyboard]}});
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
exports.requestOrders = requestOrders;
exports.returnOrder = returnOrder;

