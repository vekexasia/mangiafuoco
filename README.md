# MangiaFuoco
[![npm](https://img.shields.io/npm/v/mangiafuoco.svg)](https://npmjs.org/package/mangiafuoco) [![Build Status](https://travis-ci.org/vekexasia/mangiafuoco.svg?branch=master)](https://travis-ci.org/vekexasia/mangiafuoco) [![Coverage Status](https://coveralls.io/repos/github/vekexasia/mangiafuoco/badge.svg?branch=master)](https://coveralls.io/github/vekexasia/mangiafuoco?branch=master)

This is a way to decouple application parts. It could be used to solve different use cases:

  1. Easily Collect metrics of your application
  2. Manipulate producer data multiple unknown modifiers
  3. Create Plug n Play components without altering already working codebase
  
Lets say you've a `login` function that returns a Promise containing the user information if the login suceeds.
  
```javascript

function login(user, pass) {
  return userModel.findUser(user,pass);  
}
```

Later you realize you need to add an extra field to the returned data so you modify your code accordingly:

```javascript
function login(user, pass) {
  return userModel.findUser(user,pass)
    .then(userObj => {
      userObj.loginTime = Date.now();
      return userObj;
    });
}
```

Then you want to coherce the user to change the password if that wasn't modified for some months.

```javascript
function login(user, pass) {
  return userModel.findUser(user,pass)
    .then(userObj => {
      userObj.loginTime = Date.now();
      return userObj;
    })
    .then(userObjWTime => {
      if (userObjWTime.last_password_change + _30days < Date.now()) {
        userObj.mustChangePassword = true;
      } else {
        userObj.mustChangePassword = false;
      }
      return userObj;
    });
}
```

After 2 months. the boss gets to you and he says that he does not want to change it's password every month and you need to change your login function again adding even more complexity.

mangiafuoco to the rescue. What about having the login function doing something like:
```javascript
function login(user, pass) {
  return userModel.findUser(user,pass)
    .then(userObj => projname.map('after_user_loggedin', userObj))
}
```
Adding additional stuff shouldn't change your login function code (and tests). And adding your _boss last requirement_ should be as easy as adding your code in a separate file that should be testable by its own.

`boss_exception.js`
```javascript

export function bossExceptionHandler(userObj, cback) {
 if (userObj.uid == 'boss') {
   userObj.mustChangePassword = false;
 }
 cback(null, userObj);
};
```

then registering your exception using something like this.

```javascript
import {bossExceptionHandler} from './boss_exception';
projname.register(
  'after_user_loggedin',
  Handler.fromCback('boss_exception', bossExceptionHandler)
);
```
