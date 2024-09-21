let currentStep = 1;
let totalAmount = 0;

document.querySelectorAll('.buttons a').forEach(button => {
    button.addEventListener('click', function(event) {
        event.preventDefault();
        if (document.querySelector('.option').value === 'One-off') {
            totalAmount = parseFloat(this.getAttribute('data-amount'));
            updateTotalAmountDisplay();
        }
    });
});

document.getElementById('custom-amount').addEventListener('input', function() {
    if (document.querySelector('.option').value === 'One-off') {
        totalAmount = parseFloat(this.value) || 0;
        updateTotalAmountDisplay();
    }
});

document.querySelector('.option').addEventListener('change', function() {
    const customAmountInput = document.getElementById('custom-amount');
    const amount = parseFloat(customAmountInput.value) || 0;

    if (this.value === 'Monthly') {
        totalAmount = amount; 
        updateTotalAmountDisplay();
    } else {
        totalAmount = parseFloat(customAmountInput.value) || 0;
        updateTotalAmountDisplay();
    }
});


function updateTotalAmountDisplay() {
    document.getElementById('total-amount-display').innerText = `$${totalAmount.toFixed(2)}`;
    document.getElementById('payment-amount').value = totalAmount.toFixed(2); 
}

function nextStep() {
    const cards = document.querySelectorAll('.card');
    if (currentStep < cards.length) {
        currentStep++;
        showStep(currentStep);
    }

    // Ensure the total amount is updated when moving to step 4
    if (currentStep === 4) {
        document.getElementById('amount').innerText = `$${totalAmount.toFixed(2)}`;
    }
}


// Handle the form submission for the payment
function submitPayment() {
    const paymentMethodNonce = document.getElementById('payment-method-nonce').value;
    const email = document.getElementById('email').value;
    const name = document.getElementById('first-name').value; 

    fetch('/process-payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            paymentMethodNonce: paymentMethodNonce,
            amount: totalAmount.toFixed(2),
            email: email,
            name: name
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Payment successful:', data);
            document.getElementById('modalMessage').textContent = 'Payment successful! Thank you for your donation.';
            $('#paymentStatusModal').modal('show');
            
            // Redirect to completion step after a brief delay
            $('#paymentStatusModal').on('hidden.bs.modal', function () {
                showStep(6); 
            });
        } else {
            console.error('Payment failed:', data.message);
            document.getElementById('modalMessage').textContent = 'Payment failed: ' + data.message;
            $('#paymentStatusModal').modal('show');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('modalMessage').textContent = 'An error occurred while processing the payment.';
        $('#paymentStatusModal').modal('show');
    });
}




// Fetch the client token and initialize Braintree Drop-in UI
document.addEventListener('DOMContentLoaded', () => {
    fetch('/client-token')
        .then(response => response.text())
        .then(clientToken => {
            braintree.dropin.create({
                authorization: clientToken,
                container: '#dropin-container'
            }, function (err, dropinInstance) {
                if (err) {
                    console.error(err);
                    return;
                }

                document.getElementById('payment-form').addEventListener('submit', function (event) {
                    event.preventDefault();

                    dropinInstance.requestPaymentMethod(function (err, payload) {
                        if (err) {
                            console.error(err);
                            return;
                        }

                        document.getElementById('payment-method-nonce').value = payload.nonce;
                        submitPayment(); 
                    });
                });
            });
        })
        .catch(err => console.error('Error fetching client token:', err));
});


function showStep(step) {
    const cards = document.querySelectorAll('.card');
    const badges = document.querySelectorAll('.badge');
    cards.forEach((card, index) => {
        card.classList.remove('active');
        badges[index].classList.remove('active');
        if (parseInt(card.getAttribute('data-step')) === step) {
            card.classList.add('active');
            badges[index].classList.add('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    showStep(currentStep);
});

// details form
function showDetails() {
    var email = document.getElementById('email').value;
    if (!email) {
        document.getElementById('email-error').style.display = 'block';
        return;
    }

    document.getElementById('email-error').style.display = 'none';
    document.getElementById('additional-fields').style.display = 'block';
    document.getElementById('show-details-btn').style.display = 'none';
}

function validateAndProceed(event) {
    var valid = true;
    var title = document.getElementById('title-select-m').value;
    var firstName = document.getElementById('first-name').value;
    var lastName = document.getElementById('last-name').value;
    var address = document.getElementById('addr').value;
    var agree = document.getElementById('agree-check').checked;

    if (!title) {
        document.getElementById('title-error').style.display = 'block';
        valid = false;
    } else {
        document.getElementById('title-error').style.display = 'none';
    }

    if (!firstName) {
        document.getElementById('first-name-error').style.display = 'block';
        valid = false;
    } else {
        document.getElementById('first-name-error').style.display = 'none';
    }

    if (!lastName) {
        document.getElementById('last-name-error').style.display = 'block';
        valid = false;
    } else {
        document.getElementById('last-name-error').style.display = 'none';
    }

    if (!address) {
        document.getElementById('address-error').style.display = 'block';
        valid = false;
    } else {
        document.getElementById('address-error').style.display = 'none';
    }

    if (!agree) {
        document.getElementById('agree-error').style.display = 'block';
        valid = false;
    } else {
        document.getElementById('agree-error').style.display = 'none';
    }

    if (!valid) {
        event.preventDefault();
    } else {
        nextStep();
    }
}

function editAddress() {
    document.getElementById('address-field').disabled = false;
    document.getElementById('address-field').focus();
}

document.getElementById('addr').addEventListener('input', function() {
    document.getElementById('address-field').value = this.value;
});



// Assuming you're calling this on form submit within the modal
document.querySelector('.popup form').addEventListener('submit', function(event) {
    event.preventDefault(); 
    saveAddress();
});

// Function to open the modal
function enterAddressManually() {
    openModal();
}

function openModal() {
    document.querySelector('.popup').classList.remove('popup-hidden');
    document.querySelector('.popup').classList.add('popup-visible');
    document.body.style.background = 'rgba(214, 29, 117, 0.8)'; 
    document.body.style.overflow = 'hidden'; 
}

function closeModal() {
    document.querySelector('.popup').classList.add('popup-hidden');
    document.querySelector('.popup').classList.remove('popup-visible');
    document.body.style.background = ''; 
    document.body.style.overflow = 'auto'; 
}

// Function to save address from modal
function saveAddress() {
    const houseName = document.getElementById('house').value;
    const address1 = document.getElementById('popup-address').value;
    const address2 = document.getElementById('address-optional').value;
    const town = document.getElementById('bill-town-edit').value;
    const country = document.getElementById('country-field-edit').options[document.getElementById('country-field-edit').selectedIndex].text;
    const postcode = document.getElementById('popup-postcode').value;

    let formattedAddress = `${houseName}, ${address1}`;
    if (address2) {
        formattedAddress += `, ${address2}`;
    }
    formattedAddress += `, ${town}, ${country}, ${postcode}`;

    document.getElementById('address-field').value = formattedAddress;
    closeModal();
}



document.addEventListener('DOMContentLoaded', function () {
    const selectElement = document.querySelector('.option');
    const buttons = document.querySelector('.buttons');
    const customAmountInput = document.getElementById('custom-amount');
    const formField = document.querySelector('.form-field');
    const totalAmountDisplay = document.getElementById('total-amount-display');
    const oneOffSpan = document.querySelector('.one-off');
    const anyCheckboxContainer = document.querySelector('.any');
    const selectTippingElement = document.querySelector('select-tipping');

    selectElement.addEventListener('change', function () {
        if (selectElement.value === 'Monthly') {
            buttons.style.display = 'none';
            customAmountInput.style.display = 'none';
            formField.style.display = 'block';
            oneOffSpan.style.display = 'none';
            anyCheckboxContainer.style.display = 'none';
            selectTippingElement.style.display = 'none';
        } else {
            buttons.style.display = 'block';
            customAmountInput.style.display = 'block';
            formField.style.display = 'none';
            oneOffSpan.style.display = 'block';
            anyCheckboxContainer.style.display = 'block';
            selectTippingElement.style.display = 'none';
        }
    });

    formField.querySelector('input').addEventListener('input', function (e) {
        const amount = parseFloat(e.target.value);
        if (!isNaN(amount)) {
            totalAmountDisplay.textContent = `$${amount.toFixed(2)}`;
            totalAmount = amount;  
        } else {
            totalAmountDisplay.textContent = '$0.00';
            totalAmount = 0;
        }
    });
});


