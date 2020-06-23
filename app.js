
// BUDGET CONTROLLER -- lưu data nè -- model
var budgetController = (function () {
    // tạo type data cho model
    var Expense = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    }

    var Income = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    }

    var calculateTotal = function (type) {
        var sum = 0;
        data.allItems[type].forEach(function (cur) {
            sum += cur.value;
        });
        data.totals[type] = sum;
    };

    var data = {
        allItems: {
            exp: [], // expenses
            inc: [], // incomes
        },
        totals: {
            exp: 0,
            inc: 0,
        },
        budget: 0,
        percentage: -1, // tỉ lệ phần trăm giữa lượng tiền vào và ra
    };

    return {
        addItem: function (type, des, val) {
            var newItem, ID;

            // create new id
            ID = !data.allItems[type].length ? 0 : data.allItems[type][data.allItems[type].length - 1].id + 1; // id thằng cuối +1

            //create new item based on 'inc' or 'exp' type
            if (type === 'exp') {
                newItem = new Expense(ID, des, val);
            } else if (type === 'inc') {
                newItem = new Income(ID, des, val);
            }

            // push in to data
            data.allItems[type].push(newItem);
            return newItem; // phải return newItem ở đây để những module khác có thể sử dụng item cho vc khác
        },

        calculateBudget: function () {

            // calculate total income and expenses
            calculateTotal('exp');
            calculateTotal('inc');

            // Calculate the buget: income - expenses
            data.budget = data.totals.inc - data.totals.exp

            // calculate the percentage of income that we spent
            if (data.totals.inc > 0)
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            else
                data.percentage = -1;
        },

        getBudget: function () {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            }
        },

        testing: function () {
            console.log(data)
        }
    };

})() // dùng IIFE để bên ngoài không thể truy cập dc biến có scope ở bên trong hàm IIFE


// UI CONTROLLER
var UIController = (function () {

    var DOMstrings = { // tạo 1 obj chứa các class or id thì sau này khi sửa tên class => ko phải sửa nhiều trong code
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        exprensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage'
    }

    return {
        getInput: function () {
            return {
                type: document.querySelector(DOMstrings.inputType).value, // will be either inc or exp
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value),
            }
        },

        addListItem: function (obj, type) {
            var html, newHtml, element;
            // 1. Create HTML string placeholder textAlign: 
            if (type === 'inc') {
                element = DOMstrings.incomeContainer;
                html = `<div class="item clearfix" id="income-%id%">
                <div class="item__description">%description%</div>
                <div class="right clearfix">
                <div class="item__value">%value%</div>
                <div class="item__delete">
                    <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
                </div>
                </div>
            </div>`
            }
            else if (type === 'exp') {
                element = DOMstrings.exprensesContainer;
                html = `
                        <div class="item clearfix" id="expense-%id%">
                            <div class="item__description">%description%</div>
                            <div class="right clearfix">
                                <div class="item__value">%value%</div>
                                <div class="item__percentage">21%</div>
                                <div class="item__delete">
                                    <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
                                </div>
                            </div>
                        </div>`
            }

            // 2. replace the placeholder text with some actual data
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', obj.value);

            // 3. Insert the HTML to the DM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);

        },

        clearFields: function () { // xóa dữ liệu input sau khi submit
            var fields, fieldsArr;

            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);  // querySelectorAll trả về 1 danh sách(list), not array, dsach same arr nhưng ko có các method như arr
            // var fieldsArr = Array.prototype.slice.call(fields); // trick để chuyển list sang arr

            // fieldsArr.forEach(function(current , id, array) {
            //     current.value = '';
            // }); => không cần dùng cách này nx vì bây giờ js đã hỗ trợ

            fields.forEach(current => {
                current.value = ''
            })

            fields[0].focus(); // sau khi sumit thì chuyển focus input trở lại thằng đầu tiên
        },

        displayBudget: function (obj) {

            document.querySelector(DOMstrings.budgetLabel).textContent = obj.budget;
            document.querySelector(DOMstrings.incomeLabel).textContent = obj.totalInc;
            document.querySelector(DOMstrings.expensesLabel).textContent = obj.totalExp;

            if (obj.percentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
            } else {
                document.querySelector(DOMstrings.percentageLabel).textContent = '---'; // nếu ko có thu nhập mà lại có xuất đi thì hiển thị rỗng
            }

        },

        getDOMstrings: function () {
            return DOMstrings;
        }
    }

})();


// GLOBAL APP CONTROLLER
var controller = (function (budgetCtrl, UICtrl) {

    var setupEventListeners = function () {
        var DOM = UICtrl.getDOMstrings(); // cho cả cái này vào đây vì dom chỉ cần cho event

        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

        document.addEventListener('keypress', function (event) {

            if (event.keyCode === 13 || event.which === 13) {//13 là phím enter, dùng thêm which vì 1 số trình duyệt ko hỗ trợ keyCode
                ctrlAddItem()
            }

        });
    }

    var updateBudget = function () {
        // 1. Calculate the budget
        budgetController.calculateBudget();

        // 2. return the budget
        var budget = budgetCtrl.getBudget();

        // 3. Display the budget on the UI
        UIController.displayBudget(budget);

    }

    var ctrlAddItem = function () {
        var input, newItem;
        // 1. Get the field input data
        input = UICtrl.getInput();

        if (input.description !== '' && !isNaN(input.value) && input.value > 0) {  // kiểm tra dữ liệu input
            // 2. add the item to the budget controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);

            // 3. Add the item to the UI: 
            UICtrl.addListItem(newItem, input.type);

            // 4. CLear the fields
            UICtrl.clearFields();

            // 5. Calculate and update budget
            updateBudget();
        }
    };

    return {
        init: function () {
            UIController.displayBudget(budgetCtrl.getBudget());
            setupEventListeners();
        }
    };


})(budgetController, UIController); // truyền vào như này thay vi dùng luôn 2 module controller ở trên để khi sau này muốn đổi tên 2 module kia thì ko cần đổi sâu vào trong controller này


controller.init();