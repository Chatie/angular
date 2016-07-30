export class WechatyTestPage {
  navigateTo() {
    return browser.get('/app/index.html')
  }

  getParagraphText() {
    return element(by.css('wechaty-app')).getText()
  }
}
