{
  const clientsWrap = document.getElementById('clients__wrap');
  let listLoaded = false;
  const loader = createLoader()

  async function getClientsData() {
    document.getElementById('load').append(loader)
    const response = await fetch('http://localhost:3000/api/clients', {
      method: 'GET'
    })
      .then((res) => {
        console.log(res.status);
        if (!res.ok && res.status === 404) {
          loader.remove();
          document.getElementById('error').style.display = 'table-cell';
          document.getElementById('error').innerText = '404 Not Found';
          return Promise.reject('some other error: ' + response.status);
        } else {
          if (!res.ok) {
            loader.remove();
            document.getElementById('error').style.display = 'table-cell';
            document.getElementById('error').innerText = 'Что-то не так...';
            return Promise.reject('some other error: ' + response.status);
          } else {
            return res.json();
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });
    return {
      res: response,
      loaded: listLoaded
    };
  }

  async function getClientData(id) {
    const response = await fetch(`http://localhost:3000/api/clients/${id}`, {
      method: 'GET'
    }).then(async res => {
      return await res.json();
    })
      .catch((err) => {
        console.log(err);
      });
    return {
      res: response,
      loaded: listLoaded
    };
  }

  async function postClientsData(data) {
    const response = await fetch('http://localhost:3000/api/clients', {
      method: 'POST',
      body: JSON.stringify(data)
    }).finally();
  }

  async function changeClientsData(data, id) {
    const response = await fetch(`http://localhost:3000/api/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }).finally();
  }

  async function deleteClient(id) {
    const response = await fetch(`http://localhost:3000/api/clients/${id}`, {
      method: 'DELETE'
    }).then(() => {
      console.log('delete');
    }).catch((err) => {
      console.log(err)
    })
  }

  async function searchRequest(value) {
    const response = await fetch(`http://localhost:3000/api/clients?search=${value}`, {
      method: 'GET'
    })
      .then((res) => {
        listLoaded = true;
        return res.json()
      })
      .catch((err) => {
        console.log(err);
      });
    return {
      res: response,
      loaded: listLoaded
    };
  }

  function updateListClients(data) {
    document.querySelectorAll('.client').forEach(el => {
      el.remove()
    });
    data.res.map(el => {
      const { createdAt, id, lastName, name, surname, updatedAt, contacts } = el;
      clientsWrap.append(createClient(
        id, //id клиента
        `${name + " " + surname + " " + lastName}`, //ФИО
        contacts,//переделать контакты,
        createDate(createdAt), //дата создания
        createTime(createdAt), //время создания
        createDate(updatedAt), //дата изменения
        createTime(updatedAt), //время изменения
      ))
    });
    if (loader.parentElement) {
      loader.remove();
    }
  }

  function createFormClient(className, dataClient, isChangeForm) {
    const form = document.createElement('form');
    form.id = "form-client";
    form.className = `${className + " " + 'form-client'}`;

    const btnAddContact = createButton("add-contact__btn", "Добавить контакт", 'iconAdd');
    btnAddContact.type = 'button';
    //по клику добавляет новый контакт
    btnAddContact.addEventListener('click', () => {
      console.log(document.querySelectorAll('.add-contact__block').length);
      if (document.querySelectorAll('.add-contact__block').length >= 9) {
        document.querySelector('.add-contact__btn').style.display = 'none';
      }
      contactBlock.insertBefore(createContactLabel('tel'), btnAddContact);
    });


    const contactBlock = document.createElement('div');
    contactBlock.className = "form-client__contacts add-contact";
    dataClient?.contacts && dataClient?.contacts.length > 0 ? dataClient?.contacts.forEach((el) => {
      contactBlock.append(createContactLabel(el.type, el.value));
    }) : null
    contactBlock.append(btnAddContact);
    if (contactBlock.style.height > 200) {
      contactBlock.classList.add('add-contact--scroll');
    }

    form.append(createLabel("Фамилия", true, createInput("surname", "text", "surname", dataClient?.surname ? dataClient?.surname : '')));
    form.append(createLabel("Имя", true, createInput("name", "text", "name", dataClient?.name ? dataClient?.name : '')));
    form.append(createLabel("Отчество", true, createInput("lastName", "text", "lastName", dataClient?.lastName ? dataClient?.lastName : '')));
    form.append(contactBlock);
    const buttonSubmit = createButton('form-client__submit', 'Сохранить', '');
    buttonSubmit.type = 'submit';
    form.append(buttonSubmit);
    const validate = formValidate(form);
    validate.onSuccess(async () => {
      formGetData(form, isChangeForm, dataClient.id);
      const data = await getClientsData();
      updateListClients(data.res);
      console.log('Validation passes and form submitted');
    })
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
    })
    return form;
  }

  function formValidate(form) {
    const validate = new window.JustValidate(form);
    validate
      .addField('#name', [
        {
          rule: 'minLength',
          value: 2,
        },
        {
          errorMessage: 'Некорректное значение',
          rule: 'required',
        },
        {
          rule: 'maxLength',
          value: 30,
        },
      ])
      .addField('#surname', [
        {
          rule: 'minLength',
          value: 2,
        },
        {
          rule: 'required',
          errorMessage: 'Некорректное значение',
        },
        {
          rule: 'maxLength',
          value: 30,
        },
      ])
      .addField('#lastName', [
        {
          rule: 'minLength',
          value: 2,
        },
        {
          rule: 'required',
          errorMessage: 'Некорректное значение',
        },
        {
          rule: 'maxLength',
          value: 30,
        },
      ])
    // .addField('#email', [
    //   {
    //     rule: 'required',
    //     errorMessage: 'Email is required',
    //   },
    //   {
    //     rule: 'email',
    //     errorMessage: 'Email is invalid!',
    //   },
    // ]);
    return validate;
  }

  function formGetData(form, isChange, id) {
    const surname = form.querySelector('[name="surname"]');
    const firstName = form.querySelector('[name="name"]');
    const lastName = form.querySelector('[name="lastName"]');
    const contacts = [];
    form.querySelectorAll('.add-contact__block').forEach(element => {
      const contact = {
        "type": element.querySelector('.select__toggle').value,
        "value": element.querySelector('.form-client__input').value
      }
      contacts.push(contact);
    });

    !isChange ? postClientsData(dataClient(firstName.value, surname.value, lastName.value, contacts)) :
      changeClientsData(dataClient(firstName.value, surname.value, lastName.value, contacts), id);

  }

  function createInput(id, type, name, value) {
    const input = document.createElement('input');
    input.className = 'form-client__input';
    input.id = id;
    input.type = type;
    input.name = name;
    input.value = value;

    return input;
  }

  function createLabel(text, isRequired, input) {
    const label = document.createElement('label');
    label.className = 'form-client__label';
    label.textContent = text;

    const labelRequired = document.createElement('span');
    labelRequired.className = 'form-client__label--firm';
    labelRequired.textContent = '*';

    isRequired ? label.append(labelRequired) : null;
    label.append(input);

    return label;
  }

  function createSelectContact(block, targetValue) {
    const select = new CustomSelect(block, {
      name: 'contact', // значение атрибута name у кнопки
      targetValue: targetValue, // значение по умолчанию
      options: [['tel', 'Телефон'], ['email', 'Email'], ['vk', 'Vk'], ['fb', 'Facebook'], ['contact', 'Другое']], // опции
    });
    return select;
  }

  function createContactLabel(targetSelect, inputVal) {
    const labelContact = document.createElement('label');
    const selectContainer = document.createElement('div');
    const contactCancel = createButton('add-contact__btn-del', '', 'contactDel');
    contactCancel.addEventListener('click', () => {
      labelContact.remove();
      if (document.querySelectorAll('.add-contact__block').length <= 9 && document.querySelector('.add-contact__btn').style.display !== 'block') {
        document.querySelector('.add-contact__btn').style.display = 'block';
      }
    });
    labelContact.className = "add-contact__block";
    selectContainer.className = "add-contact__select-container";
    createSelectContact(selectContainer, targetSelect);
    labelContact.append(selectContainer);
    labelContact.append(createInput('', 'text', 'contact', inputVal ? inputVal : ''));
    labelContact.append(contactCancel);
    return labelContact;
  }

  function createCell(className, content) {
    const td = document.createElement("td").cloneNode(true);
    td.innerHTML = content ? content : null;
    td.className = className;
    return td;
  }

  function createButton(className, text, howIcon) {
    const button = document.createElement('button');
    button.className = className;
    button.appendChild(createIcon(howIcon));
    text !== '' ? button.appendChild(createText('', text)) : null;
    return button;
  }

  function createDate(date) {
    const dateFormat = new Date(date).toLocaleDateString();
    return dateFormat;
  }

  function createTime(time) {
    const timeFormat = new Date(time);
    return timeFormat.getUTCHours() + 3 + ":" + (timeFormat.getUTCMinutes() < 10 ? '0' + timeFormat.getUTCMinutes() : timeFormat.getUTCMinutes());
  }


  function createText(className, textContent) {
    const spanText = document.createElement("span");
    spanText.className = className ? className : 'text';
    spanText.textContent = textContent;
    return spanText;
  }

  //Создает клиента
  function createClient(id, fullName, contacts, dateCreate, timeCreate, dateChange, timeChange) {
    const clientWrap = document.createElement("tr");
    clientWrap.className = 'client';
    clientWrap.id = id;

    const changeCell = createCell('client__change');
    const changeBtn = createButton('client-change', 'Изменить', 'change');
    changeCell.appendChild(changeBtn);
    changeBtn.addEventListener('click', async () => {
      const modal = await createModalWindow('change', id);
      document.body.append(modal);
      setTimeout(() => modal.firstChild.classList.add('modal__container--open'), 30)
    });

    const deleteCell = createCell('client__delete');
    const deleteBtn = createButton('client-delete', 'Удалить', 'delete');
    deleteBtn.addEventListener('click', async () => {
      const modal = await createModalWindow('delete', id);
      document.body.append(modal);
      setTimeout(() => modal.firstChild.classList.add('modal__container--open'), 30)
    });

    deleteCell.appendChild(deleteBtn);

    const clientId = createCell('client__id', id);
    const clientFN = createCell('client__full-name', fullName);
    const clientContacts = createCell('client__contacts', '');
    const clientContactsWrap = document.createElement('div');
    clientContactsWrap.className = 'client__contacts-wrap';
    const contactType = {
      "tel": "Телефон",
      "fb": "Facebook",
      "vk": "VK: ",
      "email": "E-MAIL",
      "contact": "Другое"
    }
    contacts.forEach(el => {
      const contact = document.createElement('div');
      contact.className = 'client__contact';
      const contactContent = document.createElement('span');
      contactContent.className = 'client__contact-content';
      contactContent.textContent = contactType[el.type] + ':' + ' ' + el.value;
      contact.append(contactContent);
      contact.append(createIcon(el.type));
      clientContactsWrap.append(contact);
    })
    clientContacts.appendChild(clientContactsWrap);

    const clientTimeCreate = createCell('client__date-created date-and-time');
    clientTimeCreate.appendChild(createText('date-and-time__date', dateCreate));
    clientTimeCreate.appendChild(createText('date-and-time__time', timeCreate));

    const clientTimeChange = createCell('client__date-created date-and-time');
    clientTimeChange.appendChild(createText('date-and-time__date', dateChange));
    clientTimeChange.appendChild(createText('date-and-time__time', timeChange));


    clientWrap.appendChild(clientId);
    clientWrap.appendChild(clientFN);
    clientWrap.appendChild(clientTimeCreate);
    clientWrap.appendChild(clientTimeChange);
    clientWrap.appendChild(clientContacts);
    clientWrap.appendChild(changeCell);
    clientWrap.appendChild(deleteCell);
    return clientWrap;
  }

  async function createModalWindow(howModal, idClient) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'modal';

    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal__container';
    modalContainer.id = 'modal__container';

    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal__head';

    const modalTitle = document.createElement('h2');
    modalTitle.className = 'modal__title';

    function deleteClientButton(className, text) {
      const deleteBtn = createButton(className, text, '');
      deleteBtn.addEventListener('click', () => {
        deleteClient(idClient);
        updateListClients();
      });
      return deleteBtn
    }
    const modalCloseBtn = createButton('modal__close', '', 'close');
    const modalCancel = createButton('modal__cancel', 'Отмена', '');
    //закрывает модальное окно
    modalCloseBtn.addEventListener('click', () => modalClose(modal));
    modalCancel.addEventListener('click', () => modalClose(modal));
    modalContainer.append(modalHeader);
    let form;
    switch (howModal) {
      case 'delete':
        modalTitle.textContent = 'Удалить';
        modalHeader.append(modalTitle);
        modalContainer.append(createText('modal__delete-text', 'Вы действительно хотите удалить данного клиента?'));
        modalContainer.append(deleteClientButton('modal__delete-btn', 'Удалить'));
        modalContainer.append(modalCancel);
        break;
      case 'change':
        const dataClient = await getClientData(idClient);
        modalTitle.textContent = 'Изменить данные';
        modalTitle.classList.add('modal__title--left');
        form = createFormClient('modal__form', dataClient.res, true);
        modalTitle.append(createText('modal__id', `ID: ${idClient}`))
        modalHeader.append(modalTitle);
        modalContainer.append(form);
        modalContainer.append(deleteClientButton('modal__cancel', 'Удалить клиента'));
        break;
      case 'newClient':
        modalTitle.textContent = 'Новый клиент';
        modalHeader.append(modalTitle);
        form = createFormClient('modal__form', {}, false);
        modalContainer.append(form);
        modalContainer.append(modalCancel);
        break;
    }
    modalHeader.append(modalCloseBtn);
    modal.append(modalContainer)
    return modal;
  }

  function modalClose(modal) {
    if (document.contains(modal)) {
      modal.firstChild.classList.remove('modal__container--open');
      setTimeout(() => modal.remove(), 300);
    }
  }

  function dataClient(firstName, surname, lastName, contacts) {
    return {
      name: firstName,
      surname: surname,
      lastName: lastName ? lastName : '',
      contacts: contacts ? contacts : undefined
    }
  }

  function sortedById(data, up) {
    up ? data.sort((a, b) => a.id - b.id) : data.sort((a, b) => b.id - a.id)

    return data;
  }

  function sortedByFIO(data, up) {
    up ? data.sort((a, b) => parseFloat(a.name + a.surname + a.lastName) - parseFloat(b.name + b.surname + b.lastName))
      : data.sort((a, b) => parseFloat(b.name + b.surname + b.lastName) - parseFloat(a.name + a.surname + a.lastName))

    return data;
  }

  function sortedByTime(data, up, whatTime) {
    function dateGetTime(date) {
      return new Date(date).getTime();
    }
    up ? data.sort((a, b) => dateGetTime(a[`${whatTime}`]) - dateGetTime(b[`${whatTime}`]))
      : data.sort((a, b) => dateGetTime(b[`${whatTime}`]) - dateGetTime(a[`${whatTime}`]))
    return data;
  }

  function createLoader() {
    const loader = document.createElement('td');
    loader.className = 'loader';
    loader.innerHTML = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 20C2 29.941 10.059 38 20 38C29.941 38 38 29.941 38 20C38 10.059 29.941 2 20 2C17.6755 2 15.454 2.4405 13.414 3.243" stroke="#9873FF" stroke-width="4" stroke-miterlimit="10" stroke-linecap="round"/>
    </svg>`;

    return loader;
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const data = await getClientsData();
    const sortByIdBtn = document.getElementById('sortById');
    const sortByFIOBtn = document.getElementById('sortByFIO');
    const sortByTimeCreateBtn = document.getElementById('sortByTimeCreate');
    const sortByTimeChangeBtn = document.getElementById('sortByTimeChange');
    const searchInput = document.getElementById('search');

    sortByIdBtn.addEventListener('click', () => {
      data.res = sortedById(data.res, !sortByIdBtn.classList.contains('sort-btn--up'));
      console.log(data.res);
      sortByIdBtn.classList.toggle('sort-btn--up')
      updateListClients(data)
    });

    sortByFIOBtn.addEventListener('click', () => {
      data.res = sortedById(data.res, !sortByFIOBtn.classList.contains('sort-btn--up'));
      sortByFIOBtn.classList.toggle('sort-btn--up')
      updateListClients(data)
      console.log(data.res);
    });

    sortByTimeCreateBtn.addEventListener('click', () => {
      data.res = sortedById(data.res, !sortByTimeCreateBtn.classList.contains('sort-btn--up'), 'createAT');
      console.log(data.res);
      sortByTimeCreateBtn.classList.toggle('sort-btn--up')
      updateListClients(data)
    });

    sortByTimeChangeBtn.addEventListener('click', () => {
      data.res = sortedById(data.res, !sortByTimeChangeBtn.classList.contains('sort-btn--up'), 'changeAT');
      sortByTimeChangeBtn.classList.toggle('sort-btn--up')
      updateListClients(data)
    });

    searchInput.addEventListener('input', (ev) => setTimeout(
      async () => {
        const data = await searchRequest(ev.target.value);
        updateListClients(data);
      }
      , 300)
    );
    updateListClients(data);
    document.addEventListener('click', (ev) => {
      const modal = document.getElementById('modal') ? document.getElementById('modal') : null;
      if (!modal?.firstChild.contains(ev.target) && document.getElementById('modal')?.contains(ev.target)) {
        modalClose(modal);
      }
    })

    document.getElementById('add__client').addEventListener('click', async () => {
      const modal = await createModalWindow('newClient');
      document.body.append(modal);
      setTimeout(() => modal.firstChild.classList.add('modal__container--open'), 1);
    })
  })
}
