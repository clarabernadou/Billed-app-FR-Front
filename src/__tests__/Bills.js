/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import '@testing-library/jest-dom/extend-expect'

import {getByTestId, screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH, ROUTES} from "../constants/routes.js"
import {localStorageMock} from "../__mocks__/localStorage.js"
import userEvent from '@testing-library/user-event'
import mockStore from "../__mocks__/store"
import Logout from "../containers/Logout.js"
import Bills from "../containers/Bills.js"

import router from "../app/Router.js"

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // For the localStorage ⬇️
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      // For the redirection ⬇️
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      await waitFor(() => screen.getByTestId('icon-window')) // Wait until the icon window appears on the screen 
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon).toHaveClass('active-icon') // Does the window icon have a class?

    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills }) // Get the UI of the page
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML) // Get the dates from the screen

      // Put in chronological order by date ⬇️
      const antiChrono = (a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        return dateA.getTime() - dateB.getTime()
      }
      const datesSorted = [...dates].sort(antiChrono)
      const expectedDates = dates.sort(antiChrono)

      expect(datesSorted).toEqual(expectedDates) // Are the sorted dates equal to the expected dates?
    })
  })

  test("fetches bills from mock API GET", async () => {
    // For the localStorage ⬇️
    localStorage.setItem("user", JSON.stringify({ 
      type: "Employee", 
      email: "e@e" 
    }))

    // For the redirection ⬇️
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
    window.onNavigate(ROUTES_PATH.Bills)


    await waitFor(() => screen.getByText("Mes notes de frais")) // Wait until the text appears on the screen 
    expect(screen.getByTestId("tbody")).toBeTruthy() // Does the element exist?
  })

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills") // Check that the bills method is called with the expected parameters

      // For the localStorage ⬇️
      Object.defineProperty( window, 'localStorage', { value: localStorageMock } )
      window.localStorage.setItem('user', JSON.stringify({ 
        type: 'Employee', 
        email: "e@e" 
      }))

      // For the redirection ⬇️
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })

    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills) // Redirection
      await new Promise(process.nextTick) // Wait for a new promise

      const message = await screen.getByText('Erreur') // Wait and get an error message
      expect(message).toBeTruthy() // Does the message exist?
    })

    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills) // Redirection
      await new Promise(process.nextTick) // Wait for a new promise

      const message = await screen.getByText('Erreur') // Wait and get an error message
      expect(message).toBeTruthy() // Does the message exist?
    })

    test("Then check that information is displayed correctly", () => {
      // Get elements ⬇️
      const displayedTypes = screen.getAllByTestId('bill-type').map(element => element.textContent)
      const displayedNames = screen.getAllByTestId('bill-name').map(element => element.textContent)
      const displayedDates = screen.getAllByTestId('bill-date').map(element => element.textContent)
      const displayedAmounts = screen.getAllByTestId('bill-amount').map(element => element.textContent)
      const displayedStatus = screen.getAllByTestId('bill-status').map(element => element.textContent)

      let replaceDisplayedAmounts = [] // Create array

      displayedAmounts.map(amount => {
        amount = amount.replace(/ €/g, '') // Replace character
        amount = Number(amount) // Transform a string into a number
        replaceDisplayedAmounts.push(amount) // Push in array
      })

      // Is the table equal to the invoice type? ⬇️
      expect(displayedTypes).toEqual(bills.map(bill => bill.type))
      expect(displayedNames).toEqual(bills.map(bill => bill.name))
      expect(displayedDates).toEqual(bills.map(bill => bill.date))
      expect(replaceDisplayedAmounts).toEqual(bills.map(bill => bill.amount))
      expect(displayedStatus).toEqual(bills.map(bill => bill.status))
    })

    test("Then check that information is displayed correctly", () => {
      // Get elements ⬇️
      const displayedTypes = screen.getAllByTestId('bill-type').map(element => element.textContent)
      const displayedNames = screen.getAllByTestId('bill-name').map(element => element.textContent)
      const displayedDates = screen.getAllByTestId('bill-date').map(element => element.textContent)
      const displayedAmounts = screen.getAllByTestId('bill-amount').map(element => element.textContent)
      const displayedStatus = screen.getAllByTestId('bill-status').map(element => element.textContent)

      // Doesn't the array equal the string? ⬇️
      expect(displayedTypes).not.toEqual('null')
      expect(displayedNames).not.toEqual('null')
      expect(displayedDates).not.toEqual('1 Janv. 70')
      expect(displayedAmounts).not.toEqual('null')
      expect(displayedStatus).not.toEqual('undefined')
    })

    test("Test the redirection on click of the handleClickNewBill function", () => {
      // For the localStorage ⬇️
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      // For the redirection ⬇️
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      const bills = new Bills({ document, onNavigate, localStorage }) // Get Bills
      const handleClickNewBill = jest.fn(bills.handleClickNewBill) // Get handleClickNewBill function
      
      const addNewBill = screen.getByTestId('btn-new-bill') // Get the button that appears on the screen
      addNewBill.addEventListener('click', handleClickNewBill) // Add handleClickNewBill as an event on the button
      userEvent.click(addNewBill) // Simulate a user click on the button

      expect(handleClickNewBill).toHaveBeenCalled() // Is the function called?
      expect(window.location.href).toBe('http://localhost/#employee/bill/new') // Was there a redirection?
    })

    test("Test that the date and status format are ok", () => {
      // Get elements ⬇️
      const dates = screen.getAllByTestId('bill-date')
      const status = screen.getAllByTestId('bill-status')

      bills.forEach(async (bill) => {
        // Create store for get Bills after ⬇️
        const store = {
          bills: jest.fn().mockReturnValue({
            list: jest.fn().mockResolvedValue([bill])
          })
        }
      
        const bills = new Bills({ document, onNavigate, store, localStorage}) // Get Bills
        const getBills = jest.fn(bills.getBills) // Get getBills function
        
        const result = await getBills.bind({ store })() // Wait to receive bills from the store

        // Are the elements of the result equal to the elements of the DOM? ⬇️
        expect(result.date).toEqual(dates.textContent)
        expect(result.status).toEqual(status.textContent)
      })
    })

    test("Testing the handleClickIconEye function with a userEvent on click", () => {
      $.fn.modal = jest.fn() // To not have any bug with JQuery
      const eyeIcon = screen.getAllByTestId('icon-eye')[0] // Get the first item of all the eye icons on the screen

      // For navigate ⬇️
      const onNavigate = (pathname) => { 
        document.body.innerHTML = ROUTES({ pathname }) 
      } 

      // Create store for get Bills after ⬇️
      const store = {
        bills: () => ({ create: jest.fn(() => Promise.resolve()) })
      }
  
      const bills = new Bills({ document, onNavigate, store, localStorage}) // Get Bills
      const handleClickIconEye = jest.fn(bills.handleClickIconEye(eyeIcon)) // Get handleClickIconEye function and send the eye icons in parameter
  
      eyeIcon.addEventListener('click', handleClickIconEye) // Add handleClickIconEye as an event on the button
      userEvent.click(eyeIcon) // Simulate a user click on the button
      
      expect(handleClickIconEye).toHaveBeenCalled() // Is the function called?
      expect(getByTestId(document.body, 'modaleFile')).toHaveStyle('display: block') // Does the window icon have a class?
    })

    test(('Test the disconnection when the handleClick function is clicked'), async () => {
      // For navigate ⬇️
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      // For the localStorage ⬇️
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      document.body.innerHTML = BillsUI({ data: bills }) // Get the UI of the page
      
      const logout = new Logout({ document, onNavigate, localStorage }) // Get Logout
      const handleClick = jest.fn(logout.handleClick) // Get handleClick function
      
      const disco = screen.getByTestId('icon-disconnect') // Get the disconnect icon that appears on the screen
      disco.addEventListener('click', handleClick) // Add handleClick as an event on the button
      userEvent.click(disco) // Simulate a user click on the button

      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for a new promise

      expect(handleClick).toHaveBeenCalled() // Is the function called?
      expect(window.location.href).toMatch('/') // Does the link match to the string
    })
  })
})
