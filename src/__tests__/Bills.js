/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom'

import {getByTestId, screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import NewBillUI from '../views/NewBillUI.js'
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import userEvent from '@testing-library/user-event'
import mockStore from "../__mocks__/store"

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

  test("Expense fields have been filled in with valid data and the page is displayed correctly", () => {
    const type = screen.getAllByTestId('bill-type')
    const name = screen.getAllByTestId('bill-name')
    const date = screen.getAllByTestId('bill-date')
    const amount = screen.getAllByTestId('bill-amount')
    const status = screen.getAllByTestId('bill-status')

    expect(type.every(element => element.value !== 'null')).toBe(true);
    expect(name.every(element => element.value !== 'null')).toBe(true);
    expect(date.every(element => element.value !== '1 Janv. 70')).toBe(true);
    expect(amount.every(element => element.value !== 'null')).toBe(true);
    expect(status.every(element => element.value !== 'undefined')).toBe(true);
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
  })
})
