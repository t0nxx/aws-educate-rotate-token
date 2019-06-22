/* i wrote this script to rotate session key of aws educate 
 the issue is that you can't login directly to aws console , 
but login through thirdparty which give u appid,secret,token that expires every 60 min 
the main idea is that aws educate account doesn't have any control on IAM Policies in aws ,
so i've small task which i had to use aws S3 storage , which didn't work well cause 60 min exp .
// the main idea is to do login to the third party provider then gain the id,secret,token using headless browser"puppeteer"
then send the data to my back-end application every 45 min with the new data every time .
just put this line in crontab
*45 * * * * /usr/local/bin/node ~/puppeteer.js"
*/


const puppeteer = require('puppeteer');

    /// sleeping btw every step
    const sleep = (milliseconds) => {
        return new Promise(resolve => setTimeout(resolve, milliseconds))
      }

const program = async () => {

    let browser = await puppeteer.launch({headless : false});
    let awsEducatePage = await browser.newPage() ;
    let backEndPageReport = await browser.newPage() ;

    await awsEducatePage.goto('https://www.awseducate.com/signin/SiteLogin' , {waitUntil :'networkidle2'});

    // login 
    await awsEducatePage.evaluate(()=>{
        let email = document.getElementById('loginPage:siteLogin:loginComponent:loginForm:username');
        email.value = "add ur email here";
        let password = document.getElementById('loginPage:siteLogin:loginComponent:loginForm:password');
        password.value = "add ur pass here";
        trylogin();
    })
    // go to 
    await sleep(5000);  // 10 sec to consider low speed
    await awsEducatePage.goto('https://www.awseducate.com/student/s/awssite' , {waitUntil :'networkidle2'});

    
    await sleep(10000) ; // 10 sec to consider low speed
      
    async function getTemLink() {
        let awsTemLink = await awsEducatePage.evaluate(()=>{
            let link = document.getElementsByClassName('btn').item(0).href ;
            return link ;
          });
          return awsTemLink ;
    }
    let awsTemLink = await getTemLink();
    await awsEducatePage.goto(awsTemLink , {waitUntil :'networkidle2'});

    // now i'm in vocareum cpanel , let's get id,secret,token 
    
    await sleep(5000) ; // 10 sec to consider low speed

    async function getNewCred(){
      let newCred =   await awsEducatePage.evaluate(async()=>{
            showawsact(1);
           const sleep = (milliseconds) => {
               return new Promise(resolve => setTimeout(resolve, milliseconds))
             }
             await sleep(10000);
           // get credentials
         let credentials = document.getElementById('clikeybox').getElementsByTagName('span').item(0).innerHTML; 
         return credentials ;
         })
         return newCred ;
    }
  
    
    // here is the keys
    let newCredentials = await getNewCred();
    await awsEducatePage.close();
     

    // add pipe to fromat data 
    // formatedArrOfCredentials
    let result = [];
    
    let startFromAws = newCredentials.substr(10) ;
    let splitedIntoArray = startFromAws.split('\n') ;
    splitedIntoArray.pop(); // eleminate last space

splitedIntoArray.forEach(element => {
    let extractOnlyValues = element.indexOf('=') ;    // get only values
    value = element.substr(extractOnlyValues+1) ;
    result.push(value);
    //console.log(element)
});
    // console.log(result)

    //  send new cred to my backend app
    await backEndPageReport.goto(`http://localhost:3000/newCred?id=${result[0]}&secret=${result[1]}&sessionToken=${result[2]}` , {waitUntil :'networkidle2'});
    //await browser.close();
    }


program();

// example
// http://localhost:3000/newCred?id=ASIAR37EPVRQIRG7XRUC&secret=bzW1TVAKrMs5JcOAYKcvjvYb3Z8CD+B8rAO0F2KC&sessionToken=FQoGZXIvYXdzENr//////////wEaDKLhI5J17vXsm18DyiKNAzlDECKAqt3NqTiMbdf68ngXxqlmE77hFweMfnM7MTxVUXgNW/05aN79+RIYun/dJiDKHIJTv0Ut7rmPZ+r7rqObcvzjtgNgPtzeoGwyoqPvdic9vfAd7IDJAVZP9sOVXAxF4+eDPqsvDnwh7Mok2D+X2i2kHkoIBkmiAjl1DWieQ6wpNZcvhhSpJU1Ap+6cQjF7sQyovZnaJCEN1sk8rIVkSX1t97+aRDyQyK7XjW5Ic9WoVC1xt/wBF+hiwETgI7BJONfVnqIZSpgxbfdJugZ+5gE/xp+g/FU/KTx6DVXA8Ha4czQOyyV0POooWEQ1YSN4VxWI0gD5HfK1Kkqxtd4riO6ba07vCR+Eqm46/januJxw+JZYLxRIenWo/sffWRSK8/Obmq3UtZ852vBN5L0ILo6vqM6bQeG1m7YlVBpqxDzDXbAV1jEYwq6ZL9hsGEQGX50W/JpCrY9tlaXaBd2fkNCbqBL71CUlJahAK1nCZfc5bSqpibLaNsmCJ6t+REmMGwLPUMSidxIulhgom46P6AU=
