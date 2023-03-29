/**
 * @jest-environment jsdom
 */

 import '@testing-library/jest-dom'

import { getByTestId, screen, waitFor, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH} from "../constants/routes.js";
import router from "../app/Router.js";
import userEvent from '@testing-library/user-event'
import { handleChangeFile } from '../containers/NewBill.js';


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
      test('Expense type is filled', () => {
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
  
        window.onNavigate(ROUTES_PATH.NewBill)

        const input = screen.getByTestId('expense-type');
        userEvent.click(input);

        const option1 = screen.getByTestId('option1');
        const option2 = screen.getByTestId('option2');
        const option3 = screen.getByTestId('option3');
        const option4 = screen.getByTestId('option4');
        const option5 = screen.getByTestId('option5');
        const option6 = screen.getByTestId('option6');
        const option7 = screen.getByTestId('option7');

        expect(option1).toBeInTheDocument();
        expect(option2).toBeInTheDocument();
        expect(option3).toBeInTheDocument();
        expect(option4).toBeInTheDocument();
        expect(option5).toBeInTheDocument();
        expect(option6).toBeInTheDocument();
        expect(option7).toBeInTheDocument();

        userEvent.click(option1);
        expect(input).toHaveValue('Transports');
      })

      test('Expense name is filled', () => {
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

    test('Create a bill with a valid file and test the input', async () => {
      window.onNavigate(ROUTES_PATH.NewBill);

      const file = new File(['(⌐□_□)'], 'test.png', { type: 'image/png' });
      const fileInput = screen.getByTestId('file');
      
      console.log(handleChangeFile);
      // const newBill = new NewBill({ document, onNavigate, localStorage });
      // const handleChangeFile = jest.fn(newBill.handleChangeFile);
      
      // fileInput.addEventListener('change', handleChangeFile)

      fireEvent.change(fileInput, { target: { files: [file] } })
      // expect(handleChangeFile).toHaveBeenCalled()
    })

    test('Then send the form and redirected to the bills page', () => {
      const sendBtn = screen.getByTestId('btn-send-bill')
      userEvent.click(sendBtn)
      expect(window.location.href).toBe('http://localhost/#employee/bills');
    })

    
    // test('should show an error for an invalid file type', () => {
      
    // })
  })
})
