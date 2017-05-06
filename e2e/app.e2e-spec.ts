import { Angular4Page } from './app.po'

describe('angular4 App', () => {
  let page: Angular4Page

  beforeEach(() => {
    page = new Angular4Page()
  })

  it('should display message saying Wechaty', () => {
    page.navigateTo()
    expect(page.getParagraphText()).toContain('Wechaty')
  })
})
