console.log('Client-side code running');

fetch('/entries', {method: 'GET'})
    .then(function (response) {
        if (response.ok) return response.json();
        throw new Error('Request failed.');
    })
    .then(function (res) {
        populate_db_entries(res);
        //console.log(data);
    })
    .catch(function (error) {
        console.log(error);
    });

function compareRank(a, b) {
    const rankA = a.rank;
    const rankB = b.rank;

    let comparison = 0;
    if (rankA > rankB) {
        comparison = 1;
    } else if (rankA < rankB) {
        comparison = -1;
    }
    return comparison;
}

function populate_db_entries(res) {
    let tbody = document.getElementById("db_entries");

    let entry_values = [];
    for (const entry_value of Object.values(res)) {
        console.log(entry_value);
        //console.log(entry_value.item);
        entry_values.push(entry_value);
    }
    //TODO entry_values.sort(compareRank);
    //console.log(arr);

    for (const entry_value of entry_values) {
        //console.log(entry_value.rank);
        //console.log(entry_value.item);

        let tr = document.createElement("tr");
        tr.setAttribute("class", "draggable w3-row");
        tr.setAttribute("draggable", "true");

        let td_rank = document.createElement("td");
        td_rank.setAttribute("class", "w3-col");
        td_rank.setAttribute("style", "width: 40%");
        let text_rank_value = document.createTextNode(entry_value.rank);
        td_rank.appendChild(text_rank_value);

        let td_item = document.createElement("td");
        td_item.setAttribute("class", "w3-col");
        td_item.setAttribute("style", "width: 40%");
        let text_item_value = document.createTextNode(entry_value.item);
        td_item.appendChild(text_item_value);

        let td_button = document.createElement("td");
        td_button.setAttribute("class", "w3-col w3-center");
        td_button.setAttribute("style", "width: 20%");
        let del_button = document.createElement("button");
        del_button.type = "button";
        del_button.setAttribute("class", "button w3-border");
        let text_button_value = document.createTextNode("❌");
        del_button.appendChild(text_button_value);
        del_button.addEventListener('click', function () {
            document.getElementById("entry_rank").setAttribute("value", entry_value.rank);
            document.getElementById("entry_item").setAttribute("value", entry_value.item);
            document.getElementById("entry_submit_action").setAttribute("value", "delete_button");
            document.getElementById("entry_form").submit();
        });
        td_button.appendChild(del_button);

        tr.appendChild(td_rank);
        tr.appendChild(td_item);
        tr.appendChild(td_button);

        tbody.appendChild(tr);
    }

    addDragAndDrop();
};

function addDragAndDrop() {
    const draggables = document.querySelectorAll('.draggable');
    const containers = document.querySelectorAll('.container');
    //console.log(draggables);
    //console.log(containers);

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => {
            draggable.classList.add('dragging')
        });

        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging')
            //console.log(draggable.children[0].innerHTML);
            document.getElementById("entry_rank").setAttribute("value", draggable.children[0].innerHTML);
            document.getElementById("entry_item").setAttribute("value", draggable.children[1].innerHTML);
            document.getElementById("entry_submit_action").setAttribute("value", "drag_and_drop");
            document.getElementById("entry_form").submit();
        })
    });

    containers.forEach(container => {
        container.addEventListener('dragover', e => {
            e.preventDefault()
            const afterElement = getDragAfterElement(container, e.clientY);
            const dragging = document.querySelector('.dragging');
            let draggables = [...container.querySelectorAll('.draggable')];
            for (let index in draggables) {
                draggables[index].children[0].innerHTML = Array.prototype.indexOf.call(container.childNodes, draggables[index]).toString();
            }
            if (afterElement == null) {
                container.appendChild(dragging);
            } else {
                container.insertBefore(dragging, afterElement);
            }
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.draggable:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return {offset: offset, element: child};
        } else {
            return closest;
        }
    }, {offset: Number.NEGATIVE_INFINITY}).element;
}
