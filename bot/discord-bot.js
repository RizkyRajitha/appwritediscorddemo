const { Client, EmbedBuilder, GatewayIntentBits } = require("discord.js");
const fetch = require("node-fetch");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// message format function
function format(raw) {
  let dt = new Date(raw.quote.USD.last_updated);
  return {
    name: raw.name,
    symbol: raw.symbol,
    price: raw.quote.USD.price,
    h1: raw.quote.USD.percent_change_1h,
    h24: raw.quote.USD.percent_change_24h,
    lastuplk: `${dt.toLocaleString("si-LK", {
      timeZone: "Asia/Colombo",
    })} `,
  };
}

module.exports = async (req, res) => {
  const coinmarketcapkey = req.variables.coinmarketcapkey;
  const discord_token = req.variables.discord_token;

  const discordChannelId = req.variables.discordChannelId;

  // login to discord and send message
  client.login(discord_token).then(async () => {
    console.log("Bot Ready!");
    try {
      // fetch crypto data from coinmarketcap api
      let data = await fetch(
        "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=30&convert=USD&sort=market_cap",
        {
          headers: {
            "X-CMC_PRO_API_KEY": coinmarketcapkey,
          },
        }
      ).then((res) => res.json());

      // filter data to get relavent crypto cryptocurrencies
      let filterdArr = data.data
        .filter((ele) => ["BTC", "ETH"].includes(ele.symbol))
        .map((ele) => format(ele));

      for (let index = 0; index < filterdArr.length; index++) {
        const element = filterdArr[index];

        // create discord embed
        const exampleEmbed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle(`${element.name} price alert`)
          .setURL(`https://coinmarketcap.com/currencies/${element.name}/`)
          .setAuthor({
            name: "Appwrite Crypto Bot",
            iconURL: "https://img.icons8.com/fluency/344/retro-robot.png",
            url: "https://appwrite.io/",
          })
          .setDescription(`Cypto price alert for ${element.name}`)
          .setThumbnail(
            `https://img.icons8.com/color/344/${element.name.toLowerCase()}.png`
          )
          .addFields(
            { name: "Price", value: `${parseFloat(element.price).toFixed(2)}` },
            {
              name: "percent change 1h",
              value: `${Math.sign(element.h1) > 0 ? "🔼" : "🔽"} ${parseFloat(
                element.h1
              ).toFixed(2)}%`,
            },
            {
              name: "percent change 24h",
              value: `${Math.sign(element.h24) > 0 ? "🔼" : "🔽"} ${parseFloat(
                element.h24
              ).toFixed(2)}%`,
            },
            { name: "Last updated time", value: element.lastuplk }
          )
          .setTimestamp();

        // send embed to discord channel
        await client.channels.cache
          .get(discordChannelId)
          .send({ embeds: [exampleEmbed] });
      }

      console.log("alert send\nexiting...");
      // exit process
      process.exit(0);
    } catch (error) {
      console.log(error);
      // exit process with error
      process.exit(1);
    }
  });
  const trigger = req.variables.APPWRITE_FUNCTION_TRIGGER;

  res.json({
    message: "Crypto bot from Appwrite!",
    trigger,
  });
};
