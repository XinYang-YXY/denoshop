
if (document.readyState == "loading") {
	document.addEventListener("DOMContentLoaded", ready);
} else {
	window.setInterval(function(){
		ready()
	  }, 1000);
	//   document.getElementsByClassName('chatbox')[0].addEventListener('click',function(){console.log('okkkkkkkkkkkkkkk')})
}
// let messageBody = document.getElementById('message-container')
// messageBody.addEventListener('change',ready())


function ready() {
	let addToCartN = document.getElementsByClassName("addToCartNbot");
	for (let i = 0; i < addToCartN.length; i++) {
		addToCartN[i].addEventListener("click", addCartx);
		addToCartN[i].addEventListener("click", lol);
	}
	let wishlist_btn = document.getElementsByClassName("wishlist_btnx");
	for (let i = 0; i < wishlist_btn.length; i++) {
        wishlist_btn[i].addEventListener("click", addWishListx);
	}
	//document.getElementsByClassName('addToCartN').addCartBtn.addEventListener('click', addCart);
	
}

function addCartx(event) {
	let checkIfLogin = document.getElementsByClassName("shopLogoNav")[0];

	if (checkIfLogin == undefined) {
	} else {
		let button = event.target;
		let item = button.parentElement.parentElement;

		let itemName = item.getElementsByClassName("card-title")[0].innerText;

		let entry = {
			title: itemName,
		};

		fetch(`${window.origin}/cart/add`, {
			method: "POST",
			credentials: "include",
			body: JSON.stringify(entry),
			cache: "no-cache",
			headers: new Headers({
				"content-type": "application/json",
				Accept: "application/json",
			}),
		}).then(function (response) {
			if (response.status !== 200) {
				console.log(`Response status was not 200: ${response.status}`);
				return;
			}
			response.json().then(function (data) {
				console.log(data);
			});
		});
	}
}

function lol() {
	let cart = $(".shopLogoNav");
	let checkIfLogin = document.getElementsByClassName("shopLogoNav")[0];

	if (checkIfLogin == undefined) {
		alert("Please login first.🔓");
	} else {
		// Check for window size, so to target different logo
		var $window = $(window);
		var windowsize = $window.width();
		if (windowsize < 1000) {
			cart = $(".shopCartLogo");
		}

		var imgtodrag = $(this)
			.parent(".addToCartbot")
			.parent(".card-body")
			.parent(".card")
			.find("img")
			.eq(0);
		console.log(imgtodrag)
		if (imgtodrag) {
			if (cart) {
				console.log(cart);
			}

			var imgclone = imgtodrag
				.clone()
				.offset({
					top: imgtodrag.offset().top,
					left: imgtodrag.offset().left,
				})
				.css({
					opacity: "0.8",
					position: "absolute",
					height: "150px",
					width: "150px",
					"z-index": "100",
				})
				.appendTo($("body"))
				.animate(
					{
						top: cart.offset().top + 10,
						left: cart.offset().left + 10,
						width: 28,
						height: 28,
					},
					1000,
					"easeInOutExpo"
				);

			setTimeout(function () {}, 1500);

			imgclone.animate(
				{
					width: 0,
					height: 0,
				},
				function () {
					$(this).detach();

					fetch(`${window.origin}/cart/cartNum`)
						.then((res) => {
							return res.json();
						})
						.then((data) => {
							if (parseInt(data) > 99) {
								
								$(".cartNumCount").text("99+");
							} else {
								$(".cartNumCount").text(data);
							}
						})
						.catch((err) => {
							console.log(err);
						});
				}
			);
		}
	}
}

function addWishListx(event) {
    let button = event.target
    let item = button.parentElement;
	let itemID = item.getElementsByClassName("itemIDx")[0].innerText;

    if (!item.getElementsByClassName('wishlist_btnx')[0].classList.contains('activex')) {
        fetch(`${window.origin}/wishlist/add`, {
            method: "POST",
            credentials: "include",
            body: JSON.stringify({ id: itemID }),
            cache: "no-cache",
            headers: new Headers({
                "content-type": "application/json",
                Accept: "application/json",
            }),
        }).catch(err => console.log(err))

        item.getElementsByClassName('wishlist_btnx')[0].classList.add('activex')
    }
    else {
        fetch(`${window.origin}/wishlist/delete/${itemID}`).catch(err => console.log('user not logged in'))
        item.getElementsByClassName('wishlist_btnx')[0].classList.remove('activex')
    }
}


const showWishlist_btnx = async () => {
	let itemId = document.getElementsByClassName("itemIDx")
	for (let i = 0; i < itemId.length; i++) {
		await fetch(`${window.origin}/wishlist/get/${itemId[i].innerText}`
		).then((res) => {
			return res.json()
		}).then((data) => {
			if (data) {
				document.getElementsByClassName('wishlist_btnx')[i].classList.add('activex')
			}
		})
	}
}

showWishlist_btnx().catch( err => console.log('user not logged in'))