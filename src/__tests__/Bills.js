/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'
import '@testing-library/jest-dom/extend-expect'

import {getByTestId, screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import NewBillUI from '../views/NewBillUI.js'
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH, ROUTES} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import userEvent from '@testing-library/user-event'
import mockStore from "../__mocks__/store"
import Logout from "../containers/Logout.js"
import Bills from "../containers/Bills.js"

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon).toHaveClass('active-icon')

    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
      };
      const datesSorted = [...dates].sort(antiChrono);
      const expectedDates = dates.sort(antiChrono);
      expect(datesSorted).toEqual(expectedDates);      
    })
  })
  
  describe("When clicking on the eye button", () => {
    test("Then pop-up window will open", async () => {
      const eyeIcons = screen.getAllByTestId('icon-eye')
      eyeIcons.forEach(eyeIcon => {
        userEvent.click(eyeIcon)
      })
      expect(getByTestId(document.body, 'img-modal')).toHaveStyle('display: block;')
    })
  })

  test("fetches bills from mock API GET", async () => {
    localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "e@e" }));
    const root = document.createElement("div")
    root.setAttribute("id", "root")
    document.body.append(root)
    router()
    window.onNavigate(ROUTES_PATH.Bills)
    await waitFor(() => screen.getByText("Mes notes de frais"))
    expect(screen.getByTestId("tbody")).toBeTruthy()
  })

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "e@e"
      }))
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
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText('Erreur')
      expect(message).toBeTruthy()
    })

    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            return Promise.reject(new Error("Erreur 500"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText('Erreur')
      expect(message).toBeTruthy()
    })

    test("Then check that information is displayed correctly", async () => {
      const displayedTypes = screen.getAllByTestId('bill-type').map(element => element.textContent)
      const displayedNames = screen.getAllByTestId('bill-name').map(element => element.textContent)
      const displayedDates = screen.getAllByTestId('bill-date').map(element => element.textContent)
      const displayedAmounts = screen.getAllByTestId('bill-amount').map(element => element.textContent)
      const displayedStatus = screen.getAllByTestId('bill-status').map(element => element.textContent)

      let replaceDisplayedAmounts = []

      displayedAmounts.map(amount => {
        amount = amount.replace(/ €/g, '')
        amount = Number(amount)
        replaceDisplayedAmounts.push(amount)
      })

      expect(displayedTypes).toEqual(bills.map(bill => bill.type))
      expect(displayedNames).toEqual(bills.map(bill => bill.name))
      expect(displayedDates).toEqual(bills.map(bill => bill.date))
      expect(replaceDisplayedAmounts).toEqual(bills.map(bill => bill.amount))
      expect(displayedStatus).toEqual(bills.map(bill => bill.status))
    })

    test("Then check that information is displayed correctly", () => {
      const displayedTypes = screen.getAllByTestId('bill-type').map(element => element.textContent)
      const displayedNames = screen.getAllByTestId('bill-name').map(element => element.textContent)
      const displayedDates = screen.getAllByTestId('bill-date').map(element => element.textContent)
      const displayedAmounts = screen.getAllByTestId('bill-amount').map(element => element.textContent)
      const displayedStatus = screen.getAllByTestId('bill-status').map(element => element.textContent)

      expect(displayedTypes).not.toEqual('null')
      expect(displayedNames).not.toEqual('null')
      expect(displayedDates).not.toEqual('1 Janv. 70')
      expect(displayedAmounts).not.toEqual('null')
      expect(displayedStatus).not.toEqual('undefined')
    })

    test("Then test the handleClickNewBill function", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)

      const bills = new Bills({ document, onNavigate, localStorage })
      const handleClickNewBill = jest.fn(bills.handleClickNewBill)
      
      const addNewBill = screen.getByTestId('btn-new-bill')
      addNewBill.addEventListener('click', handleClickNewBill)
      userEvent.click(addNewBill)

      expect(handleClickNewBill).toHaveBeenCalled()
      expect(window.location.href).toBe('http://localhost/#employee/bill/new');
    })

    test(('Then test the handleClick function'), async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      document.body.innerHTML = BillsUI({ data: bills })
      
      const logout = new Logout({ document, onNavigate, localStorage })
      const handleClick = jest.fn(logout.handleClick)
      
      const disco = screen.getByTestId('icon-disconnect')
      disco.addEventListener('click', handleClick)
      userEvent.click(disco)

      await new Promise(resolve => setTimeout(resolve, 1000)) 
      expect(handleClick).toHaveBeenCalled()
      expect(window.location.href).toMatch('/')
    })
  })
})
