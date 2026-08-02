const fs = require('fs');

const encryptAdminMethod1 = (str) => btoa(unescape(encodeURIComponent(str)));
const encryptAdminMethod2 = (str) => str.split('').reverse().join('');
const encryptAdminMethod3 = (str) => str.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');

const encryptAdminCredentials = (input) => encryptAdminMethod3(encryptAdminMethod2(encryptAdminMethod1(input)));

// Decrypt helper for encryptAdminCredentials
// Method 3 (hex shift decode) - just maps pairs of hex characters to characters
const decryptAdminMethod3 = (hex) => {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
};
// Method 2 (reverse transposition)
const decryptAdminMethod2 = (str) => str.split('').reverse().join('');
// Method 1 (base64 decode)
const decryptAdminMethod1 = (str) => decodeURIComponent(escape(atob(str)));

const decryptAdminCredentials = (input) => decryptAdminMethod1(decryptAdminMethod2(decryptAdminMethod3(input)));

const storedAdminEmail = "74393259757757616831325a414e6a4d786b58597456485a70466d62";
const storedAdminPass = "3d3d514d416c57596f4a576471466d55";

console.log("Decrypted Email:", decryptAdminCredentials(storedAdminEmail));
console.log("Decrypted Password:", decryptAdminCredentials(storedAdminPass));
