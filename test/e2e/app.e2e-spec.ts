import { WechatyTestPage } from './app.po'

describe('Wechaty App', function() {
  let page: WechatyTestPage

  beforeEach(() => {
    page = new WechatyTestPage()
  })

  it('should display message saying "Wechaty APP Works', () => {
    page.navigateTo()
    // const t = page.getParagraphText()
    // t.then(t => console.log(t))
    const t = browser.getTitle()
    t.then(title => console.log(title))
    expect(t).toEqual('Wechaty APP Works')

    expect(element(by.css('h1')).getText()).toEqual('Wechaty App Component')

  })
})
