

const { Markup } = require("telegraf");
const {Bot, doStart,requestCity, getCity, requestName,getType,getWeight, getPrice, requestPayment, getContact, sendToChannel, getDestination, requestOrders, returnOrder } = require("./utils");
const { getOrderDetails, deleteOrder, updateOrderStatus } = require("./db");

Bot.start(async (ctx) => {
    await doStart(ctx);
    
});

Bot.action("sendmessage", async (ctx) => {
 
  console.log("user has message ", ctx);
  
})



Bot.command("new", async (ctx) => {
  if (!ctx.session) {
    return doStart(ctx);
  }
  if (ctx.session.state === "waitForPhoneNumber") {
    return await ctx.reply("لطفا از کلید ارسال شماره تلفن استفاده نمایید.");
  }

  if (ctx.session.state === "waitforCommand") {
    if (!ctx.session.name) {
      requestName(ctx);
    }else{
        requestCity(ctx);
    }
  }
});

Bot.command("my", async (ctx) => {
  if (!ctx.session) {
    return doStart(ctx);
  }
  if (ctx.session.state === "waitForPhoneNumber") {
    return await ctx.reply("لطفا از کلید ارسال شماره تلفن استفاده نمایید.");
  }
  return requestOrders(ctx);
});

Bot.on("contact", async (ctx) => {
  return getContact(ctx);
});

Bot.action("alanya", async (ctx) => {
 getCity(ctx,"آلانیا");
});

Bot.action("istanbul", async (ctx, next) => {
 getCity(ctx,"استانبول");
});

Bot.action("antalya", async (ctx, next) => {
  getCity(ctx,"آنتالیا");
});

Bot.action("tehran", async (ctx) => {
  getCity(ctx,"تهران");
});

Bot.action(/order:\d+/, async (ctx) => {

  if (!ctx.session) {
    return doStart(ctx);
  }
  const orderID = ctx.match[0].split(':')[1]; // Extract the ID from the action callback data
  
  return await returnOrder(ctx, orderID);


});

Bot.action(/delete:\d+/, async (ctx) => { 
  const orderID = ctx.match[0].split(':')[1]; // Extract the ID from the action callback data
  
  await deleteOrder(orderID)
  .then(async (res) => {
    ctx.session.state = "waitforCommand";
    return await ctx.editMessageText("بار شما با موفقیت حذف شد.",Markup.inlineKeyboard([]));
  })});

  Bot.action(/confirm:\d+/, async (ctx) => {
    const orderID = ctx.match[0].split(':')[1]; // Extract the ID from the action callback data
     const order = await getOrderDetails(orderID);
     
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
       `${phoneIcon} +${ctx.session.phoneNumber}\n\n`;


    await updateOrderStatus(orderID,'confirmed')
    .then(async (res) => {
      ctx.session.state = "waitforCommand";
      sendToChannel(text);
      return await ctx.editMessageText("بار شما با موفقیت به کانال ارسال شد.",Markup.inlineKeyboard([]));
    })});

    


// destination city

Bot.action("alanyaD", async (ctx) => {
  getDestination(ctx,"آلانیا");
 });
 
 Bot.action("istanbulD", async (ctx, next) => {
  getDestination(ctx,"استانبول");
 });
 
 Bot.action("antalyaD", async (ctx, next) => {
  getDestination(ctx,"آنتالیا");
 });
 
 Bot.action("tehranD", async (ctx) => {
  getDestination(ctx,"تهران");
 });



Bot.action("مدارک", async (ctx) => {
  getType(ctx,"مدارک");
});

Bot.action("لباس", async (ctx) => {
  getType(ctx,"لباس");
});

Bot.action("کیف و کفش", async (ctx) => {
  getType(ctx,"کیف و کفش");
});

/****  Handle Confirmation */

// User confirms the request
Bot.hears("✅ بله", async (ctx, next) => {

  if (ctx.session.state === "waitForConfirmation") {
    ctx.session.state = "waitForPayment";
    return next();
  }
    
});

Bot.hears("❌ خیر", async (ctx) => {
   if (ctx.session.state === "waitForConfirmation") {
    doStart(ctx);
   
   }
});

Bot.action("sendToChannel", async (ctx) => {

  const flag = ctx.session.city === "تهران" ? "🇮🇷" : "🇹🇷";
  const flagD = ctx.session.destination === "تهران" ? "🇮🇷" : "🇹🇷";
  const typeIcon = ctx.session.type === "مدارک" ? "📄" : ctx.session.type === "لباس" ? "👕" : "👜";

  const text = "بار مسافری\n\n" +  `<b> نام صاحب بار:</b> ${ctx.session.name}\n\n<b>شهر مبدا:</b> ${ctx.session.city}${flag}\n\n<b>شهر مقصد:</b> ${ctx.session.destination}${flagD}\n\n<b>نوع بار:</b> ${typeIcon} ${ctx.session.type}\n\n<b>وزن تقریبی:</b> ${ctx.session.weight} کیلوگرم\n\n<b>دستمزد پرداختی:</b> ${ctx.session.price} تومان\n\n 📱 +${ctx.session.phoneNumber}\n\n`;
  sendToChannel(text);
  return await ctx.editMessageText("بار شما با موفقیت در کانال ثبت شد.",Markup.inlineKeyboard([]));
});


Bot.on("message", async (ctx) => {

  
    // User can't type phone number! should use contact button
    if (ctx.session.state === "waitForPhoneNumber") {
    return await ctx.reply("لطفا از کلید ارسال شماره تلفن استفاده نمایید.");
  }


  // Session is waiting for name
  if (ctx.session.state === "waitForName") {
    ctx.session.name = ctx.message.text;
    return requestCity(ctx);    
  }

  // Session is waiting for weight
  if (ctx.session.state === "waitForWeight") {
   return getWeight(ctx);
  }


  // Session is waiting for price
  if (ctx.session.state === "waitForPrice") {
    return getPrice(ctx);
  }



  // session is waiting for payment
  if (ctx.session.state === "waitForPayment") {
    requestPayment(ctx);
  }
});

Bot.launch();
