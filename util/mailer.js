const nodeMailer = require("nodemailer");

const sendEmail = (speeding, speeding2, ktdata, currentspeedlimit, driverEmail) => {
  let transporter = nodeMailer.createTransport({
    host: "",
    port: 587,
    auth: {
      user: "",
      pass: "",
    },
  });
  //

  let mailOptions = {
    from: '', // sender address
    to: `mike.purefreight@gmail.com, ${driverEmail}`, // list of receivers

    subject: `Speeding detected for truck ${speeding.truck}`, // Subject line
    text: "Speeding detected",
    html: "Speeding detected",
    text: `Hello, 

    Following speeding has been noted:
    
        truck: ${speeding.truck} speed: ${speeding.speed} speed limit: ${speeding.speedL} location: ${speeding.locationlat}, ${
      speeding.locationlng
    } time: ${speeding.locatedat.split("T")[0]} ${speeding.locatedat.split("T")[1]}
    truck: ${speeding2.truck} speed: ${speeding2.speed} speed limit: ${speeding.speedL} location: ${speeding2.locationlat}, ${
      speeding2.locationlng
    } time: ${speeding2.locatedat.split("T")[0]} ${speeding2.locatedat.split("T")[1]}
        truck: ${ktdata.vehicle.number} speed: ${ktdata.vehicle.current_location.speed} speed limit: ${currentspeedlimit} location: ${
      ktdata.vehicle.current_location.lat
    }, ${ktdata.vehicle.current_location.lon} time: ${ktdata.vehicle.current_location.located_at}`, // plain text body
    html: ` <div style="text-align: center;">
    <div style="text-align:center; display: inline-block; border: 1px solid #808080;  border-radius: 4%; margin: 2%, 6%, 2%, 6%; max-width: 80%; min-width: 350px;">
     <img src="cid:uniquenodemailercom" style="max-width: 100%; border-radius: 4%;
    height: auto;"/>
    <p style="font-size: 16px; color:#808080">
    Hello, </p>

<p style="font-size: 16px; color:#808080; padding: 14px;">   We are reminding you to stay within speed limits. Repeating of this offence will result in fines.   </p>
    
    <p style="font-size: 16px; color:#808080">Following speeding events are under investigation: </p> 
    <br>
    <div style="border: 1px solid #808080;  border-radius: 20px; margin: 1% 6% 1% 6%;">
        <p style="color:#808080"> <b>TRUCK: </b> ${speeding.truck} </p>
        
        <p style="color:#808080"><b>RECORDED SPEED: </b> <span style="color: red;">${speeding.speed} mph </span> </p>
     <p style="color:#808080"><b>SPEED LIMIT: </b>  ${speeding.speedL}  mph </p> 
    <p style="color:#808080"><b>LOCATION: </b>  ${speeding.locDescription} ( ${speeding.locationlat}, ${
      speeding.locationlng
    }) </p> <p style="color:#808080"><b>TIME:</b> ${speeding.locatedat.split("T")[1]} ${speeding.locatedat.split("T")[0]}  </p>
    <br>
    </div>
    <br>
    <div style="border: 1px solid #808080;  border-radius: 20px; margin: 1% 6% 1% 6%;">
    <p style="color:#808080"> <b>TRUCK: </b> ${speeding2.truck} </p>
    
    <p style="color:#808080"><b>RECORDED SPEED: </b> <span style="color: red;">${speeding2.speed} mph </span> </p>
 <p style="color:#808080"><b>SPEED LIMIT: </b>  ${speeding2.speedL}  mph </p> 
<p style="color:#808080"><b>LOCATION: </b>  ${speeding2.locDescription} ( ${speeding2.locationlat}, ${
      speeding2.locationlng
    }) </p> <p style="color:#808080"><b>TIME:</b> ${speeding2.locatedat.split("T")[1]} ${speeding2.locatedat.split("T")[0]}  </p>
<br>
</div>
   <br>
    <div style="border: 1px solid #808080;  border-radius: 20px; margin: 1% 6% 1% 6%;">
   <p style="color:#808080"> <b>TRUCK: </b>: ${ktdata.vehicle.number} </p> 
   <p style="color:#808080"> <b>RECORDED SPEED: </b> <span style="color:red;"> ${ktdata.vehicle.current_location.speed} mph </span> </p>
   <p style="color:#808080">  <b>SPEED LIMIT: </b>  ${currentspeedlimit} mph </p>
    <p style="color:#808080"><b>LOCATION: </b> ${ktdata.vehicle.current_location.description.toString()} ( ${
      ktdata.vehicle.current_location.lat
    }, ${ktdata.vehicle.current_location.lon} ) </p>
    <p style="color:#808080"><b>TIME: </b>  ${ktdata.vehicle.current_location.located_at.split("T")[1]} ${
      ktdata.vehicle.current_location.located_at.split("T")[0]
    }
         </p>
         </div>
        
         <p style="color:#808080"> This is automatic email, please do not reply. </p> 
         <p style="color:#808080">Speeding data has been provided by here maps. If you have any questions or concerns please contact safety. </p></div> </div>`, // html body
    attachments: [
      {
        filename: "autop2.png",
        path: __dirname + "/autop2.png",
        cid: "uniquenodemailercom", //same cid value as in the html img src
      },
    ],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log("Message %s sent: %s", info.messageId, info.response);
  });
};
module.exports = sendEmail;
