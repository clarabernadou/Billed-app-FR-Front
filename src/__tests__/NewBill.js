/**
 * @jest-environment jsdom
 */

 import '@testing-library/jest-dom'

import { getByTestId, screen, waitFor } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH} from "../constants/routes.js";
import router from "../app/Router.js";
import userEvent from '@testing-library/user-event'


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then new bill icon in vertical layout should be highlighted", async () => {
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()

      window.onNavigate(ROUTES_PATH.NewBill)
      
      await waitFor(() => screen.getByTestId('icon-mail'))
      const mailIcon = screen.getByTestId('icon-mail')
      expect(mailIcon).toHaveClass('active-icon')
    })

    test("Then display the form", async () => {
      const formNewBill = screen.getByTestId('form-new-bill')
      expect(formNewBill).toBeInTheDocument()
    })

    describe('When you want to check that the inputs are filled', () => {
      test('Expense name is filled', () => {
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
  
        window.onNavigate(ROUTES_PATH.NewBill)

        const input = screen.getByTestId('expense-name')
        userEvent.type(input, 'Vol Londres Paris');
        expect(input).toHaveValue('Vol Londres Paris');
      })

      test('Expense amount is filled', () => {
        const input = screen.getByTestId('amount')
        userEvent.type(input, '230');
        expect(input).toHaveValue(230);
      })

      test('Expense vat is filled', () => {
        const input = screen.getByTestId('vat')
        userEvent.type(input, '23');
        expect(input).toHaveValue(23);
      })

      test('Expense pct is filled', () => {
        const input = screen.getByTestId('pct')
        userEvent.type(input, '23');
        expect(input).toHaveValue(23);
      })

      test('Expense comment is filled', () => {
        const input = screen.getByTestId('commentary')
        userEvent.type(input, 'This is a comment');
        expect(input).toHaveValue('This is a comment');
      })
    })

    test('Then send the form and redirected to the bills page', () => {
      const sendBtn = screen.getByTestId('btn-send-bill')
      userEvent.click(sendBtn)
      expect(window.location.href).toBe('http://localhost/#employee/bills');
    })
  })
})
