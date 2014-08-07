(function () {
    _.exists = function (value) {
        if (_.isUndefined(value) || _.isNull(value)) {
            return false;
        }
        return true;
    }
})(this);

$(function () {
    var content = document.getElementById('content');

    var data = new BindableObject({
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
        list: [
            { text: 'ext-0' },
            { text: 'ext-1' },
            { text: 'ext-2' },
            { text: 'ext-3' },
            { text: 'ext-4' }
        ]
    })

    window.testdata = data;

    window.binding = EZB.bind(content, window.testdata);
});