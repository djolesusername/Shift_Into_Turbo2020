const nodeMailer = require("nodemailer");
const mail24 = (drivers) => {
  let table;

  for (let i = 0; i < drivers.length; i++) {
    if (drivers[i].speeding24 || drivers[i].legal24) {
      let percentage = Number(
        drivers[i].legal24 / (drivers[i].legal24 + drivers[i].speeding24)
      );
      let percentageFixed = percentage.toFixed(2) * 100;
      table += `<tr><td>${drivers[i].name} </td> <td> ${
        drivers[i].speeding24 || 0
      }</td> <td> ${
        drivers[i].legal24 || 0
      }</td> <td> ${percentageFixed}</td></tr>`;
    }
  }
  let transporter = nodeMailer.createTransport({
    host: "",
    port: 587,
    auth: {
      user: "",
      pass: "",
    },
  });
  //
  //
  let mailOptions = {
    from: '', // sender address
    to: ``, // list of receivers

    subject: `Daily speeding test`, // Subject line
    text: "Daily speeding",
    html: "Daily speeding",
    text: `Hello, 
    Here is speeding data for last 24 hours. 
       `, // plain text body
    html: ` <div style="text-align: center;">
       <table style="width: 80%;">
       <tr style="height: 35px;">
       <th> Driver </th> <th>Speeding </th> <th> Legal </th> <th>Percentage legal </th>
       </tr> 
       ${table}
       </table>
             </div>
            
             <p style="color:#808080"> This is automatic email, please do not reply. </p> 
             <p style="color:#808080">Speeding data has been provided by here maps. If you have any questions or concerns please contact safety. </p></div> </div>`, // html body
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log("Message %s sent: %s", info.messageId, info.response);
  });
};
module.exports = mail24;
