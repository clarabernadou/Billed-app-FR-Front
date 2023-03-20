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
    test("Then pop-up window opens", async () => {
      const eyeIcons = screen.getAllByTestId('icon-eye')
      eyeIcons.forEach(eyeIcon => {
        userEvent.click(eyeIcon)
      })
      expect(getByTestId(document.body, 'img-modal')).toHaveStyle('display: block;')
    })
  })
})
