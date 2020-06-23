
// BUDGET CONTROLLER -- lưu data nè -- model
var budgetController = (function () {
    // tạo type data cho model
    var Expense = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    }

    Expense.prototype.calcPercentage = function (totalIncome) {
        if (totalIncome > 0)
            this.percentage = Math.round((this.value / totalIncome) * 100);
        else this.percentage = -1;
    }

    Expense.prototype.getPercentage = function () {
        return this.percentage;
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

        deleteItem: function (type, id) {
            var ids, index;

            ids = data.allItems[type].map(function (current) {
                return current.id;
            }) // trả về 1 mảng id

            index = ids.indexOf(id); // tìm chỉ số của item có id trùng vs id cần xóa

            if (index !== -1) {
                data.allItems[type].splice(index, 1); // xóa item có index = index tìm dc trong data
            }
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

        calculatePercentages: function () { // hàm tính toán phần trăm tiêu thụ của từng lần
            data.allItems.exp.forEach(function (current) {
                current.calcPercentage(data.totals.inc);
            })
        },

        getPercetages: function () { // hàm trả về arr phần trăm của từng item
            var allPerc = data.allItems.exp.map(function (current) {
                return current.getPercentage();
            })
            return allPerc;
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
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercLabel: '.item__percentage',
        dateLabel: '.budget__title--month',
    }

    var formatNumber = function (num, type) {
        /*
            + or - before number exactly 2 decimal points comma separating the thousands
            2310.4567 => + 2,310.46
            2000 => + 2,000.00
        */
        var numSplit, int, dec;

        num = Math.abs(num);
        num = num.toFixed(2); // fix 2 so sau dau phay

        numSplit = num.split('.'); // tách phần nguyên và sau phẩy

        int = numSplit[0];
        if (int.length > 3) {
            int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, int.length); // 2310 => 2,310
        }
        dec = numSplit[1];

        return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
    }

    var nodeListForEach = function (list, callback) {
        for (var i = 0; i < list.length; i++) { // loop qua tất cả phần tử để thay đổi content
            callback(list[i], i);
        }
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
                html = `<div class="item clearfix" id="inc-%id%">
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
                        <div class="item clearfix" id="exp-%id%">
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
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

            // 3. Insert the HTML to the DM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);

        },

        deleteListItem: function (selectorID) {
            var el = document.getElementById(selectorID); // query vào element cần xóa
            el.parentNode.removeChild(el); // lấy tk cha của element đó và dùng removeChild để xóa el đó đi (removeChild chỉ xóa dc khi biết cha của el đó)
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
            var type;
            obj.budget > 0 ? type = 'inc' : type = 'exp';
            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');

            if (obj.percentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
            } else {
                document.querySelector(DOMstrings.percentageLabel).textContent = '---'; // nếu ko có thu nhập mà lại có xuất đi thì hiển thị rỗng
            }

        },

        displayPercentages: function (percentages) { // nhận vào 1 list perc
            var fields = document.querySelectorAll(DOMstrings.expensesPercLabel); // query lấy dc list element hiển thị perc

            // var nodeListForEach = function (list, callback) {
            //     for (var i = 0; i < list.length; i++) { // loop qua tất cả phần tử để thay đổi content
            //         callback(list[i], i);
            //     }
            // }

            nodeListForEach(fields, function (current, index) {
                if (percentages[index] > 0)
                    current.textContent = percentages[index] + '%';
                else
                    current.textContent = '---';
            });
        },

        displayMonth: function () {
            var now, year, month, months;
            now = new Date();
            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            month = now.getMonth();
            year = now.getFullYear();
            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
        },

        changedType: function () {
            var fields = document.querySelectorAll( // query hết 3 input
                DOMstrings.inputType + ',' +
                DOMstrings.inputDescription + ',' +
                DOMstrings.inputValue);

            nodeListForEach(fields, function (cur) {
                cur.classList.toggle('red-focus');
            })

            document.querySelector(DOMstrings.inputBtn).classList.toggle('red')
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

        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType)
    }

    var updateBudget = function () {
        // 1. Calculate the budget
        budgetController.calculateBudget();

        // 2. return the budget
        var budget = budgetCtrl.getBudget();

        // 3. Display the budget on the UI
        UIController.displayBudget(budget);

    }

    var updatePercentages = function () {

        // 1. calculate percentages
        budgetCtrl.calculatePercentages();

        // 2. Read percentages from the budget controller
        var percentages = budgetCtrl.getPercetages()
        console.log(percentages)

        // 3. Update the UI with the new percantages
        UICtrl.displayPercentages(percentages);

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

            // 6. calculate and update percentages
            updatePercentages();
        }
    };

    var ctrlDeleteItem = function (event) {
        var itemID, splitID, type, ID;

        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id; // khi click vào btn thì lấy thẻ cha của nó * 4

        if (itemID) { // kiểm tra xem id tồn tại ko, nếu có thì là đã click đúng btn

            // id mẫu : inc-1
            splitID = itemID.split('-')
            type = splitID[0];
            ID = parseInt(splitID[1]);

            // 1. delete the item from the data structure
            budgetCtrl.deleteItem(type, ID);

            // 2. delete the item from the unicodeBidi: 
            UICtrl.deleteListItem(itemID)

            // 3. Update and show the new budget
            updateBudget();

            // 4. calculate and update percentages
            updatePercentages();

        }
    }

    return {
        init: function () {
            UICtrl.displayBudget(budgetCtrl.getBudget());
            UICtrl.displayMonth();
            setupEventListeners();
        }
    };


})(budgetController, UIController); // truyền vào như này thay vi dùng luôn 2 module controller ở trên để khi sau này muốn đổi tên 2 module kia thì ko cần đổi sâu vào trong controller này


controller.init();