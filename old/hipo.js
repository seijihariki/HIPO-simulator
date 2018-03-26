document.addEventListener("DOMContentLoaded", function(event) { 
    for(i = 0; i < 100; i++)memory[i] = 0;

    updatemem();
});

var pointer = 0;
var accum = 0;

var leiptr = 0;

var memory = new Array(100);

function numToPrint(num)
{
    var str;
    if(Math.abs(num) < 10000)str = ('000' + Math.abs(num)).slice(-4);
    else str = '' + Math.abs(num);
    if(num < 0)str = '-' + str;
    else str = '+' + str;
    return str;
}

function sendError(error)
{
    alert("Error:" + error);
}

function isNatural(str)
{
    return !isNaN(parseFloat(str));
}

var labels = [];

function isKeyword(str)
{

    switch(str)
    {
    case "CEA":
    case "CAE":
    case "Som":
    case "Sub":
    case "Mul":
    case "Div":
    case "Rem":
    case "Rev":
    case "Lei":
    case "Imp":
    case "Nop":
    case "Des":
    case "DNI":
    case "DDZ":
    case "DPo":
    case "DZe":
    case "DNe":
    case "DPI":
    case "Par":
        return true;
        break;
    default:
        return false;
    }
}

function getLabels(code)
{
    console.log("Getting labels...");
    var lines = code.split('\n');
    var currline = 0;
    for(i = 0; i < lines.length; i++)
    {
        var command = lines[i];
        var parsed = command.split(' ');
        var empty_index = parsed.indexOf('');
        while(empty_index >= 0)
        {
            parsed.splice(empty_index, 1);
            empty_index = parsed.indexOf('');
        }

        var offset = 0;
        if(!isKeyword(parsed[0]) && parsed.length > 1)
        {
            if(isNatural(parsed[0 + offset]))
            {
                currline = parseFloat(parsed[0 + offset]);
                offset = 1;
                repeat = true;
            }
            if(!isKeyword(parsed[0 + offset]))labels[parsed[0 + offset]] = currline;
        }
        currline++;
    }
    console.log("Got labels!!");
    console.log(labels);
}

function translateAddr(addr)
{
    if(isNatural(addr))return parseFloat(addr);
    else
    {
        if (typeof labels[addr] !== 'undefined')
        {
           return parseFloat(labels[addr]);
        }else
        {
            sendError("Label " + addr + " does not exist!");
        }
    }
}

function translate(code)
{
    code = code.replace(/\+/g, '');
    getLabels(code);
    var lines = code.split('\n');
    var currline = 0;
    console.log(lines);
    for(i = 0; i < lines.length; i++)
    {
        var command = lines[i];
        var parsed = command.split(' ');
        var empty_index = parsed.indexOf('');
        while(empty_index >= 0)
        {
            parsed.splice(empty_index, 1);
            empty_index = parsed.indexOf('');
        }
        
        console.log("Command: " + parsed);
        
        var offset = 0;
        
        console.log("Now at command " + command);

        if(parsed.length == 1)
        {
            if(isNatural(parsed[0]))
            {
                memory[currline] = parseFloat(parsed[0]);
                currline++;
                continue;
            }else
            {
                sendError(parsed[0] + " is not a valid number!!");
                return;
            }
        }else if(parsed.length == 2 && isNatural(parsed[0]))
        {
            currline = parseFloat(parsed[0]);
            memory[currline] = parseFloat(parsed[1]);
            currline++;
            continue;
        }

        if(!isKeyword(parsed[0]))
        {
            console.log("checking " + parsed[0]);
            if(isNatural(parsed[0]))
            {
                offset = 1;
                currline = parseFloat(parsed[0]);
                console.log("Changing address to " + currline);
            }

            if (typeof labels[parsed[0 + offset]] !== 'undefined')
            {
                console.log("" + parsed[0 + offset] + " is defined!");
                if(isNatural(parsed[1 + offset]))
                {
                    console.log("" + parsed[1 + offset] + " is a Number!");
                    memory[labels[parsed[0 + offset]]] = parseFloat(parsed[1 + offset]);
                    console.log("Memory address " + labels[parsed[0 + offset]] + " set to " + parseFloat(parsed[1 + offset]));
                    offset = -1;
                }else offset++;
            }else
            {
                if(!isKeyword(parsed[0 + offset])){sendError("Label " + parsed[0 + offset] + " not found!!"); return;}
            }
        }
        if(offset < 0){
            currline ++;
            continue;
        }
        memory[currline] = 0;
        console.log("Entering switch... on command " + parsed[0 + offset]);
        switch(parsed[0 + offset])
        {
        case "Null":
            memory[currline] = 0;
            break;
        case "CEA":
            memory[currline] += 1100;
            memory[currline] += translateAddr(parsed[1 + offset]);
            break;
        case "CAE":
            memory[currline] += 1200;
            memory[currline] += translateAddr(parsed[1 + offset]);
            break;
        case "Som":
            memory[currline] += 2100;
            memory[currline] += translateAddr(parsed[1 + offset]);
            break;
        case "Sub":
            memory[currline] += 2200;
            memory[currline] += translateAddr(parsed[1 + offset]);
            break;
        case "Mul":
            memory[currline] += 2300;
            memory[currline] += translateAddr(parsed[1 + offset]);
            break;
        case "Div":
            memory[currline] += 2400;
            memory[currline] += translateAddr(parsed[1 + offset]);
            break;
        case "Rem":
            memory[currline] += 2500;
            memory[currline] += translateAddr(parsed[1 + offset]);
            break;
        case "Rev":
            memory[currline] += 2900;
            break;
        case "Lei":
            memory[currline] += 3100;
            memory[currline] += translateAddr(parsed[1 + offset]);
            break;
        case "Imp":
            memory[currline] += 4100;
            memory[currline] += translateAddr(parsed[1 + offset]);
            break;
        case "Nop":
            memory[currline] += 5000;
            break;
        case "Des":
            memory[currline] += 5100;
            memory[currline] += translateAddr(parsed[1 + offset]);
            break;
        case "DNI":
            memory[currline] += 5200;
            memory[currline] += translateAddr(parsed[1 + offset]);
            break;
        case "DDZ":
            memory[currline] += 5300;
            memory[currline] += translateAddr(parsed[1 + offset]);
            break;
        case "DPo":
            memory[currline] += 5400;
            memory[currline] += translateAddr(parsed[1 + offset]);
            break;
        case "DZe":
            memory[currline] += 5500;
            memory[currline] += translateAddr(parsed[1 + offset]);
            break;
        case "DNe":
            memory[currline] += 5600;
            memory[currline] += translateAddr(parsed[1 + offset]);
            break;
        case "DPI":
            memory[currline] += 5700;
            memory[currline] += translateAddr(parsed[1 + offset]);
            break;
        case "Par":
            memory[currline] += 7000;
            break;
    default:
        }
        currline++;
    }
    updatemem();
    //alert("translated!!");
}

function copyMachine() {
    var text = '';
    var last_nonzero = 0;
    for(i = 0; i < 100; i++)
    {
        if(memory[i] != 0)last_nonzero = i;
    }
    for(i = 0; i < last_nonzero; i++)
    {
        text += numToPrint(memory[i]) + '\n';
    }
    text += numToPrint(memory[last_nonzero]);
    document.getElementById("compiled").value = text;
}

var interval_id;

function start(ips, pip)
{
    pointer = parseFloat(pip);
    interval_id = setInterval(step, 1000/parseFloat(ips));
}

function step()
{
    var instruction = memory[pointer];
    pointer++;
    var com_addr = (instruction%100);
    var com_type = (instruction-com_addr)%10000;
    switch(com_type)
    {
    case 1100:
        accum = memory[com_addr];
        break;
    case 1200:
        memory[com_addr] = accum;
        break;
    case 2100:
        accum += memory[com_addr];
        break;
    case 2200:
        accum -= memory[com_addr];
        break;
    case 2300:
        accum *= memory[com_addr];
        break;
    case 2400:
        accum = Math.floor(accum / memory[com_addr]);
        break;
        case 2500:
            accum = Math.floor(accum) % Math.floor(memory[com_addr]);
            break;
        case 2900:
            accum = -accum;
            break;
    case 3100:
        var inp_lines = document.getElementById('input').value.split('\n');
        var inpindex = inp_lines.indexOf('');
        //while(inpindex >= 0)
        //{
        //    inp_lines.splice(inpindex, 1);
        //    inpindex = inp_lines.indexOf('');
        //}
        var inputted = inp_lines[leiptr++];
        inputted = inputted.replace(/\+/g, '');
        if(isNatural(inputted))memory[com_addr] = parseFloat(inputted);
        else
        {
            sendError(" Inputed value '" + inputted + "' is not a number");
            clearInterval(interval_id);
            return;
        }
        break;
    case 4100:
        document.getElementById('output').value += '' + memory[com_addr] + '\n';
        var ta = document.getElementById('output');
        ta.scrollTop = ta.scrollHeight;
        break;
    case 5000:
        break;
    case 5100:
        pointer = com_addr;
        break;
    case 5200:
        if(accum <= 0) pointer = com_addr;
        break;
    case 5300:
        if(accum != 0) pointer = com_addr;
        break;
    case 5400:
        if(accum > 0) pointer = com_addr;
        break;
    case 5500:
        if(accum == 0) pointer = com_addr;
        break;
    case 5600:
        if(accum < 0) pointer = com_addr;
        break;
    case 5700:
        if(accum >= 0) pointer = com_addr;
        break;
    case 7000:
        clearInterval(interval_id);
        break;
    default:
        pointer--;
        sendError("Command invalid at address " + pointer);
        clearInterval(interval_id);
        break;
    }
    updatemem();
}

function reset()
{
    accum = 0;
    pointer = 0;
    leiptr = 0;
    labels = new Array();
    document.getElementById('output').value = '';
    for(i = 0; i < 100; i++)memory[i] = 0;
    updatemem();
}

function updatemem()
{
    document.getElementById('pip').value = pointer;
    document.getElementById('acc').value = accum;
    document.getElementById('inpptr').value = leiptr;
    for(var i = 0; i < 100; i++)
    {
        if(i%2 == 0) document.getElementById("add" + ('0' + i).slice(-2)).className = "tg-ipa7";
        else document.getElementById("add" + ('0' + i).slice(-2)).className = "tg-e8z9";
        document.getElementById("add" + ('0' + i).slice(-2)).innerHTML = numToPrint(memory[i]);
    }
    document.getElementById("add" + ('0' + pointer).slice(-2)).className = "pointed";
}
