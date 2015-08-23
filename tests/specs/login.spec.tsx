/// <reference path="../../tools/typings/jasmine/jasmine.d.ts"/>
import Login from '../../src/components/login';
import AppStores from '../../src/appstores';
import LoginActions from '../../src/actions/loginactions';

import * as jsdom from 'jsdom';
let React = require('react/addons');
let ReactTestUtils = React.addons.TestUtils;

describe("Login", () => {
    it("should show login from controls", () => {
        var loginForm = React.render(<Login store={AppStores.loginStore} />, document.body);
        expect(ReactTestUtils.scryRenderedDOMComponentsWithTag(loginForm, "input").length).toBe(3);
    });

    it("should show validation errors when there are values in errors property of loginStore", () => {

        AppStores.loginStore.setErrors({
            username: "Username cannot be empty",
            password: "password cannot be empty",
            credential: ""
        });
        var loginForm = React.render(<Login store={AppStores.loginStore} />, document.body);
        expect(React.findDOMNode(loginForm.refs["usernameError"]).innerHTML.length).toBeGreaterThan(0);
        expect(React.findDOMNode(loginForm.refs["passwordError"]).innerHTML.length).toBeGreaterThan(0);
        expect(React.findDOMNode(loginForm.refs["credentialError"]).innerHTML.length).toBe(0);
    });

    it("should call authenticate when login button is clicked, and form is valid", () => {
        //jsdom doesn't support html5 checkValidity..
        //tried pollyfilling using H5F, but react doesn't like it.
        HTMLFormElement.prototype.checkValidity = () => true;

        spyOn(LoginActions, 'authenticate')
        var loginForm = React.render(<Login store={AppStores.loginStore} />, document.body);

        ReactTestUtils.Simulate.click(React.findDOMNode(loginForm.refs["btnLogin"]));

        expect(LoginActions.authenticate).toHaveBeenCalled();
    });

    it("should call setErrors when login button is clicked, and form is invalid", () => {
        //jsdom doesn't support html5 checkValidity..
        //tried pollyfilling using H5F, but react doesn't like it.
        HTMLFormElement.prototype.checkValidity = () => false;

        spyOn(LoginActions, 'setErrors')
        var loginForm = React.render(<Login store={AppStores.loginStore} />, document.body);

        ReactTestUtils.Simulate.click(React.findDOMNode(loginForm.refs["btnLogin"]));

        expect(LoginActions.setErrors).toHaveBeenCalled();
    });

    beforeEach(function() {
        (global as any).document = jsdom.jsdom('<!doctype html><html><body></body></html>');
        (global as any).window = document.defaultView;
        (global as any).Element = (global as any).window.Element;
        (global as any).HTMLFormElement = (global as any).window.HTMLFormElement;
        (global as any).navigator = {
            userAgent: 'node.js'
        };
    });

    afterEach(function(done) {
        (global as any).document = null;
        (global as any).window = null;
        (global as any).Element = null;
        (global as any).navigator = {
            userAgent: 'node.js'
        };
        setTimeout(done)
    });
});
