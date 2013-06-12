//
// Agodo Extension
// [screen:id] -> <a href="http://agodo.com/screen/id">Screen id</a>
//

(function ()
{

    var agodo = function (converter)
    {
        return [

            // @username syntax
            { type: 'lang', regex: '\\[screen:(\\d+)\\]', replace: function (match, leadingSlash, id)
            {
                if (leadingSlash === '\\') {
                    return match;
                } else {
                    return '<span class="screen"><a href="#screen=' + id + '"><img src="/screen/' + id + '" alt="Screen ' + id
                            + '" title="Screen ' + id + '"/><span class="caption">Screen ' + id + '</a></span>';
                }
            }}

        ];
    };

    // Client-side export
    if (typeof window !== 'undefined' && window.Showdown && window.Showdown.extensions) {
        window.Showdown.extensions.agodo = agodo;
    }
    // Server-side export
    if (typeof module !== 'undefined') {
        module.exports = agodo;
    }

}());
