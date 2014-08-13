(function () {
    _.exists = function (value) {
        if (_.isUndefined(value) || _.isNull(value)) {
            return false;
        }
        return true;
    }
})(this);

$(function () {
    var sideContents = $('div.side_content');
    window.test_1 = {
        test: {
            value: 'James!'
        },
        name: 'Main Value Name',
        rootvalue: 'The Source!',
        options: [
            {
                text: 'One',
                listing: [
                    { text: '1-0' },
                    { text: '1-1' },
                    { text: '1-2' },
                    { text: '1-3' },
                    { text: '1-4' }
                ]
            },
            {
                text: 'Two',
                listing: [
                    { text: '2-0' },
                    { text: '2-1' },
                    { text: '2-2' },
                    { text: '2-3' },
                    { text: '2-4' }
                ]
            },
        ],
        //list: [
        //    { text: 'ext-0' },
        //    { text: 'ext-1' },
        //    { text: 'ext-2' },
        //    { text: 'ext-3' },
        //    { text: 'ext-4' }
        //]
    };

    window.test_2 ={
        test: {
            value: 'James!'
        },
        name: 'Secondary Value Name',
        rootvalue: 'Not the source',
        options: [
            {
                text: 'Three',
                listing: [
                            { text: '3-0' },
                            { text: '3-1' },
                            { text: '3-2' },
                ]
            },
            {
                text: 'Four',
                listing: [
                            { text: '4-0' },
                            { text: '4-1' },
                            { text: '4-2' },
                ]
            },
            {
                text: 'Five',
                listing: [
                            { text: '5-0' },
                            { text: '5-1' },
                            { text: '5-2' },
                ]
            },
        ],
        list: [
            { text: 'ext-5' },
            { text: 'ext-6' },
            { text: 'ext-7' },
        ]
    };

    $('#bind_one_1').on('click', function () {
        if (_.isUndefined(window.binding_1)) {
            window.binding_1 = EZB.bind(sideContents[0], window.test_1);
            window.bounddata_1 = window.test_1
        }
        else if(window.bounddata_1 === window.test_2)
        {
            window.bounddata_1 = window.test_1;
            window.binding_1.setDataSource(window.test_1);
        }
    })

    $('#bind_two_1').on('click', function () {
        if (_.isUndefined(window.binding_1)) {
            window.binding_1 = EZB.bind(sideContents[0], window.test_2);
            window.bounddata_1 = window.test_2
        }
        else if (window.bounddata_1 === window.test_1) {
            window.bounddata_1 = window.test_2;
            window.binding_1.setDataSource(window.test_2);
        }
    })

    $('#unbind_1').on('click', function () {
        if (!_.isUndefined(window.binding_1)) {
            window.binding_1.unbind('reset');
            delete window.binding_1;
        }
    })

    $('#bind_one_2').on('click', function () {
        if (_.isUndefined(window.binding_2)) {
            window.binding_2 = EZB.bind(sideContents[1], window.test_1);
            window.bounddata_2 = window.test_1
        }
        else if (window.bounddata_2 === window.test_2) {
            window.bounddata_2 = window.test_1;
            window.binding_2.setDataSource(window.test_1);
        }
    })

    $('#bind_two_2').on('click', function () {
        if (_.isUndefined(window.binding_2)) {
            window.binding_2 = EZB.bind(sideContents[1], window.test_2);
            window.bounddata_2 = window.test_2
        }
        else if (window.bounddata_2 === window.test_1) {
            window.bounddata_2 = window.test_2;
            window.binding_2.setDataSource(window.test_2);
        }
    })

    $('#unbind_2').on('click', function () {
        if (!_.isUndefined(window.binding_2)) {
            window.binding_2.unbind('reset');
            delete window.binding_2;
        }
    })
});