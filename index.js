const { setTimeout } = require("timers/promises");
const fs = require("fs");
const chalk = require("chalk");

const {Builder, By, Actions, until} = require("selenium-webdriver");
const chrome = require('selenium-webdriver/chrome');

const ROOT = "https://20.218.86.144:8443/";
const PATH = ROOT + "prweb/app/enablement/YprT5lj2tcHKjP9hoxf5RIyO6leochRs*/!STANDARD";

// Credentials - fill in information provided in the email
const MAIL = "<mail>";
const PASS = "<pass>";

const CAMPAIGN = process.argv[2] ?? "PegaAutomation3";

let BROWSER;

const l = {
  lbl: chalk.bold.green,
  val: chalk.bgGreen
}

async function getBrowser() {
  const options = new chrome
    .Options()
    .addArguments("--ignore-ssl-errors=yes", "--ignore-certificate-errors", "--window-size=2560,1440", "--enable-javascript");

    return await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();
}

async function login() {
  // Search email field by id, and input the email
  await BROWSER.findElement(By.id("txtUserID")).sendKeys(MAIL);
  // Search password field by id, and input the password
  await BROWSER.findElement(By.id("txtPassword")).sendKeys(PASS);

  // Perform a click on the button with id "sub"
  await BROWSER.findElement(By.id("sub")).click();
}

// Open the decision hub by clickin on the right buttons
async function openDecisionHub() {
  await BROWSER.findElement(By.xpath("//a[@title='Launch portal']")).click();

  const menuItemPath = By.xpath("//span[text()='Customer Decision Hub']");
  await BROWSER.wait(until.elementLocated(menuItemPath), 2000);

  const element = await BROWSER.findElement(menuItemPath);
  const link =  await element.findElement(By.xpath("./../.."));
  await link.click();

  await setTimeout(1000);

  // The decision hub opens in a different tab -> switch the tab
  const handles = await BROWSER.getAllWindowHandles();
  await BROWSER.switchTo().window(handles[1]);
}

// Do the correct click to open the campaigns view
async function openCampaigns() {
  const navPath = By.className("menu-format-primary-navigation");

  await BROWSER.wait(until.elementLocated(navPath), 1000);
  const link = await BROWSER.findElement(By.xpath("//li[@title='Campaigns']/a"));
  link.click();

  const sublinkPath = By.xpath("//li[@title='Campaigns']/ul/li[3]/a");
  const sublink = await BROWSER.wait(until.elementLocated(sublinkPath), 1000);
  sublink.click();
}

// The campaigns view opens in an iframe
async function openTestedCampaign() {
  const campaignPath = By.xpath(`//span[text()='${CAMPAIGN}']`);
  const button = await BROWSER.wait(until.elementLocated(campaignPath), 1000);
  button.click();

  // Get the iframe source, and navigate to that url
  const iframe = await BROWSER.wait(until.elementLocated(By.name("PegaGadget2Ifr"), 1000));
  const src = await iframe.getAttribute("src");

  await BROWSER.get(src);
  
  await setTimeout(1000);
}

// Take a screeshot of the current page
async function screenshot() {
  const img = await BROWSER.takeScreenshot();
  fs.writeFileSync(`${CAMPAIGN}.png`, img, 'base64')
}

// Logg the information in a nice visual manner
async function logValue(value, label) {
  const val = value
    .toLowerCase()
    .replaceAll(label.toLowerCase(), "")
    .replaceAll("\n", "")
    .trim();
  console.log(l.lbl(label) + " " + l.val(val));
}

async function getCardInfo(lbl) {
  const label = await BROWSER.wait(until.elementLocated(By.xpath("//span[text()='" + lbl + "']")), 1000);
  const conversion = await label.findElement(By.xpath("./../../.."));
  return await conversion.findElement(By.xpath("./div[1]"));
}

async function test() {
  screenshot();

  const conversion = await getCardInfo("Conversion Rate");
  logValue(await conversion.getText(), "Conversion Rate");

  const actions = await getCardInfo("Actions Initiated");
  logValue(await actions.getText(), "Actions Initiated");
}

// Entry point into the program
(async function example() {
  BROWSER = await getBrowser();
  
  try {
    await BROWSER.get(PATH);
    
    await login();
    await openDecisionHub();
    await openCampaigns();

    await openTestedCampaign();
    await test();

  } finally {
    await BROWSER.quit();
  }
})();