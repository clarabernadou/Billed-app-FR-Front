/**
 * @jest-environment jsdom
 */

 import '@testing-library/jest-dom'

import { screen, waitFor, fireEvent } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import router from "../app/Router.js"
import userEvent from '@testing-library/user-event'
import { bills } from '../fixtures/bills.js'
import store from '../__mocks__/store.js'

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then new bill icon in vertical layout should be highlighted", async () => {
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))

      // For the redirection ⬇️
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill) // Redirection to make sure you are on the right page
      
      await waitFor(() => screen.getByTestId('icon-mail')) // Wait until the icon appears on the screen
      const mailIcon = screen.getByTestId('icon-mail')

      expect(mailIcon).toHaveClass('active-icon') // Check that the icon has the class "active-icon"
    })

    test("Then display the form", () => {
      const formNewBill = screen.getByTestId('form-new-bill')
      expect(formNewBill).toBeInTheDocument() // Check that the form appears on the page
    })

    describe('When you want to check that the inputs are filled', () => {
      test('Expense type is filled', () => {
        // For the redirection ⬇️
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.NewBill) // Redirection to make sure you are on the right page

        const input = screen.getByTestId('expense-type')
        userEvent.click(input) // Reproduce a user click on the input

        const option1 = screen.getByTestId('option1')
        const option2 = screen.getByTestId('option2')
        const option3 = screen.getByTestId('option3')
        const option4 = screen.getByTestId('option4')
        const option5 = screen.getByTestId('option5')
        const option6 = screen.getByTestId('option6')
        const option7 = screen.getByTestId('option7')

        // Check that the options appear in the page ⬇️
        expect(option1).toBeInTheDocument()
        expect(option2).toBeInTheDocument()
        expect(option3).toBeInTheDocument()
        expect(option4).toBeInTheDocument()
        expect(option5).toBeInTheDocument()
        expect(option6).toBeInTheDocument()
        expect(option7).toBeInTheDocument()

        userEvent.click(option1) // Reproduce a user click on option 1
        expect(input).toHaveValue('Transports') // Check if the input returns the right value
      })

      // Check that the entries are complete ⬇️
      test('Expense name is filled', () => {
        const input = screen.getByTestId('expense-name')
        userEvent.type(input, 'Vol Londres Paris')
        expect(input).toHaveValue('Vol Londres Paris')
      })     

      test('Expense amount is filled', () => {
        const input = screen.getByTestId('amount')
        userEvent.type(input, '230')
        expect(input).toHaveValue(230)
      })

      test('Expense vat is filled', () => {
        const input = screen.getByTestId('vat')
        userEvent.type(input, '23')
        expect(input).toHaveValue(23)
      })

      test('Expense pct is filled', () => {
        const input = screen.getByTestId('pct')
        userEvent.type(input, '23')
        expect(input).toHaveValue(23)
      })

      test('Expense comment is filled', () => {
        const input = screen.getByTestId('commentary')
        userEvent.type(input, 'This is a comment')
        expect(input).toHaveValue('This is a comment')
      })
      // ------------------------------------------
    })

    test('Then send the form and redirected to the bills page', () => {
      const sendBtn = screen.getByTestId('btn-send-bill')
      userEvent.click(sendBtn) // Reproduce a user click on the button
      expect(window.location.href).toBe('http://localhost/#employee/bills') // Check that the redirection has been done
    })

    test('Test adding a file to the handleChangeFile function', () => {
      // For newBill parameters ⬇️
      const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) }
      const store = {
        bills: () => ({ create: jest.fn(() => Promise.resolve()) })
      }
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = NewBillUI()

      onNavigate(ROUTES_PATH.NewBill) // Redirection to make sure you are on the right page

      // Retrieving handleChangeFile ⬇️
      const newBill = new NewBill({ document, onNavigate, store, localStorage})
      const handleChangeFile = jest.fn(newBill.handleChangeFile)

      
      const file = new File(['(⌐□_□)'], 'test.png', { type: 'image/png' }) // Create a test file
      const fileInput = screen.getByTestId('file') // Import input
      
      
      fileInput.addEventListener('change', handleChangeFile) // Add event to input
      fireEvent.change(fileInput, { target: { files: [file] } }) // Add a test file to input

      expect(handleChangeFile).toHaveBeenCalled() // Check that the function is called
    })
    
    test('Add new bill with mockStore / POST test', () => {
      const onNavigate = (pathname) => { document.body.innerHTML = ROUTES({ pathname }) }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }))
      document.body.innerHTML = NewBillUI()

      onNavigate(ROUTES_PATH.NewBill) // Redirection to make sure you are on the right page

      const newBill = new NewBill({ document, onNavigate, store, localStorage})

      const expenseTypeInput = screen.getByTestId('expense-type')
      const expenseNameInput = screen.getByTestId('expense-name')
      const dateInput =  screen.getByTestId('datepicker')
      const amountInput = screen.getByTestId('amount')
      const vatInput = screen.getByTestId('vat')
      const pctInput = screen.getByTestId('pct')
      const commentInput = screen.getByTestId('commentary')
      const justificationInput = screen.getByTestId('file')

      const file = new File(['Hello, world!'], 'test.jpg', { type: 'image/jpeg' });

      const submitBtn = screen.getByTestId('btn-send-bill')
      
      userEvent.selectOptions(expenseTypeInput, 'Fournitures de bureau');
      userEvent.type(expenseNameInput, 'Agrafeuse');
      userEvent.type(dateInput, '2022-03-01');
      userEvent.type(amountInput, '9');
      userEvent.type(vatInput, '1');
      userEvent.type(pctInput, '2');
      userEvent.type(commentInput, "Achat d'une nouvelle agrafeuse pour le bureau");
      userEvent.upload(justificationInput, file);
      userEvent.click(submitBtn)

      expect(window.location.href).toBe('http://localhost/#employee/bills') // Check that the redirection has been done
    })
  })
})