import JSSoup from 'jssoup';
import decode from 'html-entities-decoder';

export const generateJavascript = (rule: any) => {
  // Some HTML tags are having closing forward slash like <img /> <source />
  // But when it comes to browser (chrome, safari, etc) the slash is removed while bundle is processed in the browser itself
  // https://www.w3schools.com/tags/att_img_src.asp
  // Ticket Ref: https://fleetstudio.atlassian.net/browse/WAL-276
  const context = replaceAllStringOccurrences(rule.context, '"/>', '">');
  const editedContext = replaceAllStringOccurrences(
    rule.editedContext,
    '"/>',
    '">'
  );
  if (context == '<head>') {
    if (editedContext.includes('<title>'))
      return appendChildIntoHeadElement('TITLE', editedContext);
    else return bodyReplacer(context, editedContext);
  } else if (rule.selector == 'html')
    return addAttributeUsingSelector(rule.selector, editedContext);
  else if (
    editedContext.includes('<video') ||
    editedContext.includes('<audio') ||
    editedContext.includes('<button') ||
    editedContext.includes('<a')
  )
    return processTagsViaAttributesJs(context, editedContext);
  else return bodyReplacer(context, editedContext);
};

function appendChildIntoHeadElement(element: string, editedContext: string) {
  var title = editedContext.match(/<title[^>]*>([^<]+)<\/title>/)[1];
  return (
    `\ntry {\nvar x = document.createElement(` +
    '`' +
    element +
    '`' +
    `);
            var t = document.createTextNode(` +
    '`' +
    title +
    '`' +
    `);
            x.appendChild(t);
            document.head.appendChild(x); \n}catch(err){}`
  );
}

function addAttributeUsingSelector(selector: string, editedContext: string) {
  let attsDetails = removeHTMLTagFromString(selector, editedContext);
  return (
    `\ntry {\nvar b = document.querySelector(` +
    '`' +
    selector +
    '`' +
    `);
    b.setAttribute(` +
    '`' +
    attsDetails.attr +
    '`' +
    `, ` +
    '`' +
    attsDetails.value +
    '`' +
    `);\n }catch(err){}`
  );
}

function removeHTMLTagFromString(selector: string, string: string) {
  let attribute = replaceAllStringOccurrences(string, '<' + selector, '');
  attribute = replaceAllStringOccurrences(attribute, '>', '');
  const myArray = attribute.split('=');
  let finalObject = {
    attr: replaceAllStringOccurrences(myArray[0].trim(), '"', ''),
    value: replaceAllStringOccurrences(myArray[1].trim(), '"', ''),
  };
  return finalObject;
}

function processTagsViaAttributesJs(
  initialValue: string,
  replacementValue: string
) {
  var initialHtmlAttr = new JSSoup(initialValue)?.nextElement?.attrs;
  var replacementHtmlAttr = new JSSoup(replacementValue)?.nextElement?.attrs;
  let string = `\ntry {\n`;
  if (initialHtmlAttr && Object.keys(initialHtmlAttr).length > 0) {
    let missingProperties = getMissingAttributes(
      initialHtmlAttr,
      replacementHtmlAttr
    );
    if (initialHtmlAttr.id) {
      string +=
        `var element = document.getElementById(` +
        '`' +
        initialHtmlAttr.id +
        '`' +
        `);\n`;
    } else if (initialHtmlAttr.class) {
      string +=
        `var element = document.getElementsByClassName(` +
        '`' +
        initialHtmlAttr.id +
        '`' +
        `);\n`;
    } else {
      let key = Object.keys(initialHtmlAttr)[0];
      let value = decode(initialHtmlAttr[key]);
      let querySelector = '[' + key + '="' + value + '"]';
      string +=
        `var element = document.querySelector(` +
        '`' +
        querySelector +
        '`' +
        `);\n`;
    }
    string += addMisssingAttributes(missingProperties);
    return string + `}catch(err){}`;
  }
  return bodyReplacer(initialValue, replacementValue);
}

function addMisssingAttributes(array: any) {
  let string = ``;
  for (let i = 0; i < array.length; i++) {
    const element = array[i];
    string +=
      `element.setAttribute(` +
      '`' +
      element.key +
      '`' +
      `, ` +
      '`' +
      element.value +
      '`' +
      `);\n`;
  }
  return string;
}

function getMissingAttributes(object1: any, object2: any) {
  let finalObject = [];
  for (const key in object2) {
    if (!object1.hasOwnProperty(key)) {
      finalObject.push({
        key: key,
        value: object2[key],
      });
    } else if (object1[key] !== object2[key]) {
      finalObject.push({
        key: key,
        value: object2[key],
      });
    }
  }
  return finalObject;
}

// Function to replace all occuranceses of given regular expression
function replaceAllStringOccurrences(
  string: any,
  initialValue: string,
  replacementValue: string
) {
  if (typeof string === 'string' || string instanceof String)
    return string.replace(new RegExp(initialValue, 'g'), replacementValue);
  return string;
}

function bodyReplacer(initialValue: string, replacementValue: string) {
  return (
    `\ntry {
        document.body.innerHTML = document.body.innerHTML.replace(` +
    '`' +
    initialValue +
    '`,`' +
    replacementValue +
    '`)' +
    `
        }catch(err){}`
  );
}
